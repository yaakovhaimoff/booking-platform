export default function StoreHeader({ name, slug }) {
  return (
    <div className="mb-8 text-center">
      <h1 className="text-3xl font-bold text-gray-900">{name}</h1>
      <span className="text-sm text-gray-400 mt-1 inline-block">/store/{slug}</span>
    </div>
  )
}
