import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPersona, chatWithPersona } from '../services/api'

const ARCHETYPE_COLORS = {
  intellectual:     'text-blue-300',
  creative:         'text-purple-300',
  adventurer:       'text-green-300',
  careerist:        'text-yellow-300',
  nurturer:         'text-pink-300',
  rebel:            'text-red-300',
  social_butterfly: 'text-orange-300',
  homebody:         'text-teal-300',
  athlete:          'text-lime-300',
  spiritualist:     'text-indigo-300',
  free_spirit:      'text-cyan-300',
  traditionalist:   'text-amber-300',
}

export default function ChatPage() {
  const { name } = useParams()
  const navigate = useNavigate()
  const decodedName = decodeURIComponent(name)

  const [persona, setPersona] = useState(null)
  const [messages, setMessages] = useState([]) // [{role, content}]
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(null)

  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    getPersona(decodedName)
      .then((res) => setPersona(res.data))
      .catch(() => setFetchError('Persona not found.'))
  }, [decodedName])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const history = [...messages] // snapshot before adding new user msg
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)

    try {
      const res = await chatWithPersona(decodedName, text, history)
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '(Could not reach the backend — is it running?)' },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-500">
        <p>{fetchError}</p>
        <button onClick={() => navigate('/personas')} className="text-purple-400 text-sm hover:underline">
          ← Back to Personas
        </button>
      </div>
    )
  }

  if (!persona) {
    return (
      <div className="flex justify-center py-24">
        <span className="w-8 h-8 border-2 border-slate-700 border-t-purple-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px-4rem)]">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/personas')}
              className="text-slate-500 hover:text-slate-300 transition-colors text-sm"
            >
              ←
            </button>
            <h2 className="font-semibold text-slate-100">{persona.name}</h2>
            <span className={`text-xs font-medium ${ARCHETYPE_COLORS[persona.archetype]}`}>
              {persona.archetype.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1 ml-6">
            {persona.age} · {persona.occupation} · {persona.nationality}
          </p>
        </div>
        <button
          onClick={() => setMessages([])}
          className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-2 pr-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
            <p className="text-sm">Say something to {persona.name.split(' ')[0]}</p>
            <p className="text-xs max-w-xs text-center">{persona.background}</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300 shrink-0 mr-2 mt-0.5">
                {persona.name[0]}
              </div>
            )}
            <div
              className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-purple-700 text-white rounded-tr-sm'
                  : 'bg-card border border-border text-slate-200 rounded-tl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300 shrink-0 mr-2 mt-0.5">
              {persona.name[0]}
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-3">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${persona.name.split(' ')[0]}...`}
          rows={1}
          className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors resize-none"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 rounded-xl transition-colors text-sm font-medium"
        >
          Send
        </button>
      </div>
    </div>
  )
}
