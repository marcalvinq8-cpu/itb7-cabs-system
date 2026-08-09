import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

/**
 * A plain text input that shows a type-ahead dropdown of matching
 * suggestions as the user types. Suggestions are derived client-side from
 * whatever list of candidate strings the caller passes in — no extra
 * network requests.
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

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase()
    if (!q) return []
    const seen = new Set()
    const out = []
    for (const raw of suggestions) {
      if (!raw) continue
      const s = String(raw)
      const lower = s.toLowerCase()
      if (lower === q || seen.has(lower) || !lower.includes(q)) continue
      seen.add(lower)
      out.push(s)
      if (out.length >= maxSuggestions) break
    }
    return out
  }, [value, suggestions, maxSuggestions])

  const showDropdown = focused && matches.length > 0

  const select = s => {
    onChange(s)
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
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-[#E5E7E9] rounded-lg shadow-lg max-h-60 overflow-y-auto text-sm">
          {matches.map((s, i) => (
            <button
              key={s}
              type="button"
              onMouseDown={e => { e.preventDefault(); select(s) }}
              onMouseEnter={() => setHighlighted(i)}
              className={`w-full text-left px-3 py-2 truncate transition-colors cursor-pointer ${
                i === highlighted ? 'bg-[#FADBD8]/40 text-[#96281B]' : 'text-[#1C2833] hover:bg-[#FADBD8]/20'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
