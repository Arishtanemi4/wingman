import { useState } from 'react'

export default function TagInput({ value, onChange, placeholder }) {
  const [input, setInput] = useState('')

  const add = () => {
    const tag = input.trim()
    if (tag && !value.includes(tag)) {
      onChange([...value, tag])
    }
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
    } else if (e.key === 'Backspace' && !input && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap gap-2 p-2 bg-slate-900 border border-border rounded-lg focus-within:border-purple-500 transition-colors min-h-[44px]">
      {value.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 bg-purple-900/50 text-purple-300 border border-purple-700/50 text-xs px-2 py-1 rounded-full"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="text-purple-400 hover:text-white leading-none"
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={add}
        placeholder={value.length ? '' : placeholder}
        className="flex-1 min-w-[120px] bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none"
      />
    </div>
  )
}
