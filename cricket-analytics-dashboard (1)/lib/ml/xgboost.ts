// XGBoost (Gradient Boosting) Implementation
// Sequential tree building with gradient-based optimization

interface BoostTree {
  splits: Array<{
    feature: number
    threshold: number
    gain: number
  }>
  leafValues: number[]
  weight: number
}

interface XGBoostModel {
  trees: BoostTree[]
  learningRate: number
  accuracy: number
}

export class XGBoost {
  private trees: BoostTree[] = []
  private learningRate: number = 0.1
  private accuracy: number = 0
  private initialPrediction: number = 0.5

  // Train XGBoost on player performance data
  train(
    playerData: Array<{
      average: number
      strikeRate: number
      recentPerformance: number
      formScore: number
      selected: boolean
    }>,
    numRounds: number = 50,
    maxDepth: number = 7
  ): void {
    this.trees = []
    this.learningRate = 0.1

    // Initialize with base prediction (mean of target)
    const selectedCount = playerData.filter((d) => d.selected).length
    this.initialPrediction = selectedCount / playerData.length

    // Current predictions for all samples
    let predictions = playerData.map(() => this.initialPrediction)

    for (let round = 0; round < numRounds; round++) {
      // Calculate residuals (gradient)
      const residuals = playerData.map((sample, idx) => {
        const target = sample.selected ? 1 : 0
        return target - predictions[idx]
      })

      // Fit tree to residuals
      const tree = this.fitTree(playerData, residuals, maxDepth)
      this.trees.push(tree)

      // Update predictions
      for (let i = 0; i < predictions.length; i++) {
        const treeOutput = this.predictSingleTree(
          {
            average: playerData[i].average,
            strikeRate: playerData[i].strikeRate,
            recentPerformance: playerData[i].recentPerformance,
            formScore: playerData[i].formScore,
          },
          tree
        )
        predictions[i] += this.learningRate * treeOutput
        predictions[i] = Math.min(1, Math.max(0, predictions[i]))
      }
    }

    // Calculate accuracy
    this.accuracy = this.calculateAccuracy(playerData, predictions)
  }

  // Predict player suitability (0-1 score)
  predict(features: { average: number; strikeRate: number; recentPerformance: number; formScore: number }): number {
    let prediction = this.initialPrediction

    for (const tree of this.trees) {
      const treeOutput = this.predictSingleTree(features, tree)
      prediction += this.learningRate * treeOutput
      prediction = Math.min(1, Math.max(0, prediction))
    }

    return prediction
  }

  private fitTree(
    data: Array<any>,
    residuals: number[],
    maxDepth: number,
    depth: number = 0
  ): BoostTree {
    if (depth >= maxDepth || residuals.every((r) => Math.abs(r) < 0.01)) {
      const avgResidual = residuals.reduce((a, b) => a + b, 0) / residuals.length
      return {
        splits: [],
        leafValues: [avgResidual],
        weight: 1,
      }
    }

    const featureNames = ['average', 'strikeRate', 'recentPerformance', 'formScore']
    let bestGain = 0
    let bestSplit = null
    let bestLeftIndices: number[] = []
    let bestRightIndices: number[] = []

    // Find best split
    for (let featureIdx = 0; featureIdx < featureNames.length; featureIdx++) {
      const feature = featureNames[featureIdx]
      const values = [...new Set(data.map((d) => d[feature]))].sort((a, b) => a - b)

      for (let i = 0; i < values.length - 1; i++) {
        const threshold = (values[i] + values[i + 1]) / 2

        const leftIndices = data
          .map((d, idx) => ({ d, idx }))
          .filter(({ d }) => d[feature] <= threshold)
          .map(({ idx }) => idx)

        const rightIndices = data
          .map((d, idx) => ({ d, idx }))
          .filter(({ d }) => d[feature] > threshold)
          .map(({ idx }) => idx)

        if (leftIndices.length === 0 || rightIndices.length === 0) continue

        // Calculate gain using variance reduction
        const gain = this.calculateGain(
          residuals,
          leftIndices,
          rightIndices
        )

        if (gain > bestGain) {
          bestGain = gain
          bestSplit = { feature: featureIdx, threshold }
          bestLeftIndices = leftIndices
          bestRightIndices = rightIndices
        }
      }
    }

    if (!bestSplit || bestGain === 0) {
      const avgResidual = residuals.reduce((a, b) => a + b, 0) / residuals.length
      return {
        splits: [bestSplit || { feature: 0, threshold: 0, gain: 0 }],
        leafValues: [avgResidual],
        weight: 1,
      }
    }

    const leftResiduals = bestLeftIndices.map((idx) => residuals[idx])
    const rightResiduals = bestRightIndices.map((idx) => residuals[idx])

    return {
      splits: [{ ...bestSplit, gain: bestGain }],
      leafValues: [
        leftResiduals.reduce((a, b) => a + b, 0) / leftResiduals.length,
        rightResiduals.reduce((a, b) => a + b, 0) / rightResiduals.length,
      ],
      weight: 1,
    }
  }

  private calculateGain(residuals: number[], leftIndices: number[], rightIndices: number[]): number {
    const leftResiduals = leftIndices.map((idx) => residuals[idx])
    const rightResiduals = rightIndices.map((idx) => residuals[idx])

    const leftVar =
      leftResiduals.length > 0
        ? leftResiduals.reduce((a, b) => a + Math.pow(b, 2), 0) / leftResiduals.length
        : 0

    const rightVar =
      rightResiduals.length > 0
        ? rightResiduals.reduce((a, b) => a + Math.pow(b, 2), 0) / rightResiduals.length
        : 0

    const totalVar = residuals.reduce((a, b) => a + Math.pow(b, 2), 0) / residuals.length

    const gain =
      totalVar -
      (leftIndices.length / residuals.length) * leftVar -
      (rightIndices.length / residuals.length) * rightVar

    return gain
  }

  private predictSingleTree(
    features: { average: number; strikeRate: number; recentPerformance: number; formScore: number },
    tree: BoostTree
  ): number {
    if (tree.splits.length === 0) {
      return tree.leafValues[0]
    }

    const split = tree.splits[0]
    const featureNames = ['average', 'strikeRate', 'recentPerformance', 'formScore']
    const featureValue = features[featureNames[split.feature] as keyof typeof features]

    if (featureValue <= split.threshold) {
      return tree.leafValues[0]
    } else {
      return tree.leafValues[1] || tree.leafValues[0]
    }
  }

  private calculateAccuracy(data: Array<any>, predictions: number[]): number {
    let correct = 0

    for (let i = 0; i < data.length; i++) {
      const predicted = predictions[i] > 0.5 ? 1 : 0
      const actual = data[i].selected ? 1 : 0

      if (predicted === actual) correct++
    }

    return (correct / data.length) * 100
  }

  getAccuracy(): number {
    return this.accuracy
  }
}
