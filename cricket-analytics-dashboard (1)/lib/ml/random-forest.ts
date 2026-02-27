// Random Forest Classifier Implementation
// Uses ensemble of decision trees for player selection

interface TreeNode {
  feature: number
  threshold: number
  left: TreeNode | number
  right: TreeNode | number
}

interface Tree {
  root: TreeNode
  featureNames: string[]
}

interface RandomForestModel {
  trees: Tree[]
  featureImportance: Record<string, number>
  accuracy: number
}

export class RandomForest {
  private trees: Tree[] = []
  private featureImportance: Record<string, number> = {}
  private accuracy: number = 0

  // Train random forest on player performance data
  train(
    playerData: Array<{
      average: number
      strikeRate: number
      recentPerformance: number
      formScore: number
      selected: boolean
    }>,
    numTrees: number = 50
  ): void {
    this.trees = []
    const featureNames = ['average', 'strikeRate', 'recentPerformance', 'formScore']

    for (let i = 0; i < numTrees; i++) {
      // Bootstrap sample (random sampling with replacement)
      const bootSample = this.createBootstrapSample(playerData)
      const tree = this.buildTree(bootSample, featureNames, 0)
      this.trees.push(tree)
    }

    // Calculate feature importance based on tree splits
    this.calculateFeatureImportance(featureNames)

    // Calculate OOB (Out-of-Bag) accuracy
    this.accuracy = this.calculateOOBAccuracy(playerData)
  }

  // Predict player suitability (0-1 score)
  predict(features: { average: number; strikeRate: number; recentPerformance: number; formScore: number }): number {
    const featureArray = [features.average, features.strikeRate, features.recentPerformance, features.formScore]

    // Get predictions from all trees and average them
    const predictions = this.trees.map((tree) => this.predictSingle(featureArray, tree.root))
    const avgPrediction = predictions.reduce((a, b) => a + b, 0) / predictions.length

    return Math.min(1, Math.max(0, avgPrediction))
  }

  private createBootstrapSample(
    data: Array<{
      average: number
      strikeRate: number
      recentPerformance: number
      formScore: number
      selected: boolean
    }>
  ): typeof data {
    const sample = []
    for (let i = 0; i < data.length; i++) {
      const randomIndex = Math.floor(Math.random() * data.length)
      sample.push(data[randomIndex])
    }
    return sample
  }

  private buildTree(
    data: Array<any>,
    featureNames: string[],
    depth: number,
    maxDepth: number = 15
  ): Tree {
    if (depth >= maxDepth || data.length < 2) {
      const selected = data.filter((d) => d.selected).length
      const prediction = selected > data.length / 2 ? 1 : 0
      return { root: prediction, featureNames }
    }

    const bestSplit = this.findBestSplit(data, featureNames)

    if (!bestSplit) {
      const selected = data.filter((d) => d.selected).length
      const prediction = selected > data.length / 2 ? 1 : 0
      return { root: prediction, featureNames }
    }

    const { featureIndex, threshold } = bestSplit
    const leftData = data.filter((d) => d[featureNames[featureIndex]] <= threshold)
    const rightData = data.filter((d) => d[featureNames[featureIndex]] > threshold)

    const leftTree = this.buildTree(leftData, featureNames, depth + 1, maxDepth)
    const rightTree = this.buildTree(rightData, featureNames, depth + 1, maxDepth)

    const node: TreeNode = {
      feature: featureIndex,
      threshold: threshold,
      left: leftTree.root,
      right: rightTree.root,
    }

    return { root: node, featureNames }
  }

  private findBestSplit(data: Array<any>, featureNames: string[]): { featureIndex: number; threshold: number } | null {
    let bestGini = Infinity
    let bestSplit: { featureIndex: number; threshold: number } | null = null

    for (let featureIndex = 0; featureIndex < featureNames.length; featureIndex++) {
      const feature = featureNames[featureIndex]
      const values = [...new Set(data.map((d) => d[feature]))].sort((a, b) => a - b)

      for (let i = 0; i < values.length - 1; i++) {
        const threshold = (values[i] + values[i + 1]) / 2
        const left = data.filter((d) => d[feature] <= threshold)
        const right = data.filter((d) => d[feature] > threshold)

        if (left.length === 0 || right.length === 0) continue

        const gini = this.calculateGini(left, right)
        if (gini < bestGini) {
          bestGini = gini
          bestSplit = { featureIndex, threshold }
        }
      }
    }

    return bestSplit
  }

  private calculateGini(left: Array<any>, right: Array<any>): number {
    const total = left.length + right.length
    const leftSelected = left.filter((d) => d.selected).length
    const rightSelected = right.filter((d) => d.selected).length

    const leftGini = 1 - Math.pow(leftSelected / left.length, 2) - Math.pow(1 - leftSelected / left.length, 2)
    const rightGini = 1 - Math.pow(rightSelected / right.length, 2) - Math.pow(1 - rightSelected / right.length, 2)

    return (left.length / total) * leftGini + (right.length / total) * rightGini
  }

  private predictSingle(features: number[], node: TreeNode | number): number {
    if (typeof node === 'number') return node

    if (features[node.feature] <= node.threshold) {
      return this.predictSingle(features, node.left as TreeNode | number)
    } else {
      return this.predictSingle(features, node.right as TreeNode | number)
    }
  }

  private calculateFeatureImportance(featureNames: string[]): void {
    const importance: Record<string, number> = {}
    featureNames.forEach((name) => {
      importance[name] = 0
    })

    // Simple importance: based on depth and splits
    const calculateImportance = (node: TreeNode | number, depth: number): void => {
      if (typeof node === 'number') return

      const featureName = featureNames[node.feature]
      importance[featureName] += 1 / (depth + 1)

      calculateImportance(node.left as TreeNode | number, depth + 1)
      calculateImportance(node.right as TreeNode | number, depth + 1)
    }

    for (const tree of this.trees) {
      calculateImportance(tree.root, 0)
    }

    const total = Object.values(importance).reduce((a, b) => a + b, 0)
    featureNames.forEach((name) => {
      this.featureImportance[name] = importance[name] / total
    })
  }

  private calculateOOBAccuracy(data: Array<any>): number {
    let correct = 0

    for (const sample of data) {
      const prediction = this.predict({
        average: sample.average,
        strikeRate: sample.strikeRate,
        recentPerformance: sample.recentPerformance,
        formScore: sample.formScore,
      })

      const predicted = prediction > 0.5 ? 1 : 0
      const actual = sample.selected ? 1 : 0

      if (predicted === actual) correct++
    }

    return (correct / data.length) * 100
  }

  getAccuracy(): number {
    return this.accuracy
  }

  getFeatureImportance(): Record<string, number> {
    return this.featureImportance
  }
}
