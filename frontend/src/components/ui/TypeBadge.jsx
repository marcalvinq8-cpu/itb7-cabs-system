export default function TypeBadge({ type }) {
  if (!type) return null
  const isBook = type === 'book'
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
        isBook
          ? 'bg-[#EAFAF1] text-[#1E8449] border-[#A9DFBF]'
          : 'bg-[#D6EAF8] text-[#1A5276] border-[#AED6F1]'
      }`}
    >
      {isBook ? 'Book' : 'Reserve'}
    </span>
  )
}
