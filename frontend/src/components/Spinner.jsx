export default function Spinner({ size = 8, light = false }) {
  return (
    <div
      className={`w-${size} h-${size} border-2 rounded-full animate-spin ${
        light
          ? 'border-white/30 border-t-white'
          : 'border-teal-200 border-t-teal-600'
      }`}
    />
  )
}
