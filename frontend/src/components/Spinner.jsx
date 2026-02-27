export default function Spinner({ size = 8 }) {
  return (
    <div
      className={`w-${size} h-${size} border-2 border-teal-500 border-t-transparent rounded-full animate-spin`}
    />
  )
}
