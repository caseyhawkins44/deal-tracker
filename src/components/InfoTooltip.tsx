export default function InfoTooltip({ content }: { content: string }) {
  return (
    <span className="relative group inline-flex items-center ml-1 align-middle">
      <span className="cursor-help w-4 h-4 rounded-full border border-gray-400 text-gray-400 hover:border-blue-500 hover:text-blue-500 text-[10px] font-bold inline-flex items-center justify-center select-none transition-colors">
        i
      </span>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-gray-900 text-white text-xs rounded-xl p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl whitespace-normal leading-relaxed">
        {content}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </span>
    </span>
  )
}
