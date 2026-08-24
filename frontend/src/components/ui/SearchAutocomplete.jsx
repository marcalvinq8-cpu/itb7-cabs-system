import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

/**
 * A plain text input that shows a type-ahead dropdown of matching
 * suggestions as the user types. Suggestions are derived client-side from
 * whatever list of candidates the caller passes in — no extra network
 * requests.
 *
 * Each entry in `suggestions` can be either a plain string (rendered as a
 * simple text row, the original behavior) or an object
 * `{ id?, label, sublabel?, avatarText?, avatarColorClass? }` for a richer
 * "person" style row — avatar initials + name + a secondary line (e.g. email).
 */
export default function SearchAutocomplete({
  value,
  onChange,
  suggestions = [],
  placeholder,
  wrapperClassName = 'relative',
  inputClassName,
  iconClassName = 'absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#C0392B] pointer-events-none',
  maxSuggestions = 6,
}) {
  const [focused, setFocused] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)

  const normalized = useMemo(() => suggestions
    .map((s, i) => (typeof s === 'string' ? { id: i, label: s } : s))
    .filter(item => item?.label),
    [suggestions])

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase()
    if (!q) return []
    const seen = new Set()
    const out = []
    for (const item of normalized) {
      const label = String(item.label)
      const lower = label.toLowerCase()
      const subLower = item.sublabel ? String(item.sublabel).toLowerCase() : ''
      const isMatch = lower.includes(q) || subLower.includes(q)
      if (!isMatch || lower === q) continue
      const key = item.id ?? lower
      if (seen.has(key)) continue
      seen.add(key)
      out.push(item)
      if (out.length >= maxSuggestions) break
    }
    return out
  }, [value, normalized, maxSuggestions])

  const showDropdown = focused && matches.length > 0

  const select = item => {
    onChange(item.label)
    setFocused(false)
    setHighlighted(-1)
  }

  const onKeyDown = e => {
    if (!showDropdown) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted(i => Math.min(i + 1, matches.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (highlighted >= 0 && matches[highlighted]) {
        e.preventDefault()
        select(matches[highlighted])
      }
    } else if (e.key === 'Escape') {
      setFocused(false)
    }
  }

  return (
    <div className={wrapperClassName}>
      <Search className={iconClassName} />
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setHighlighted(-1) }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={inputClassName}
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
      />
      {showDropdown && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-[#E5E7E9] rounded-lg shadow-lg max-h-72 overflow-y-auto text-sm">
          {matches.map((item, i) => (
            <button
              key={item.id ?? item.label}
              type="button"
              onMouseDown={e => { e.preventDefault(); select(item) }}
              onMouseEnter={() => setHighlighted(i)}
              className={`w-full flex items-center gap-2.5 text-left px-3 py-2 transition-colors cursor-pointer ${
                i === highlighted ? 'bg-[#FADBD8]/40 text-[#96281B]' : 'text-[#1C2833] hover:bg-[#FADBD8]/20'
              }`}
            >
              {item.avatarText && (
                <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white ${item.avatarColorClass || 'bg-[#C0392B]'}`}>
                  {item.avatarText}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate">{item.label}</span>
                {item.sublabel && (
                  <span className="block text-xs text-[#717D7E] truncate">{item.sublabel}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
