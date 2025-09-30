import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const [recent, setRecent] = useState<string[]>([])

  const RECENT_KEY = 'recentSearches'

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(RECENT_KEY) : null
      if (raw) setRecent(JSON.parse(raw).slice(0, 3))
    } catch (e) {
    }
  }, [])

  function saveRecent(term: string) {
    if (!term) return
    try {
      setRecent((prev) => {
        const list = Array.from(new Set([term, ...prev]))
        const trimmed = list.slice(0, 3)
        try {
          localStorage.setItem(RECENT_KEY, JSON.stringify(trimmed))
        } catch (e) {
        }
        return trimmed
      })
    } catch (e) {
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    saveRecent(trimmed)
    navigate(`/results?query=${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="h-[45%] w-full bg-[url('/src/assets/Figma.png')] bg-cover bg-center relative">
        <h1 className="absolute top-24 left-40 text-white text-5xl font-bold drop-shadow-lg max-w-md whitespace-normal">Find My Professor</h1>
        <p className="absolute top-48 left-40 text-white text-xl drop-shadow-lg max-w-lg whitespace-normal leading-relaxed">Want to know more about the professors here at UMD? This is the perfect place to learn a bit about the courses they teach and their grade distributions.</p>
      </div>

      <div className="h-[55%] w-full bg-white flex flex-col items-center pt-10">
        <h1 className="text-black text-4xl font-semibold">Enter a Professor to start...</h1>

        <form onSubmit={handleSubmit} className="relative w-6/12 mt-8">
          <input
            value={query}
            onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
            type="text"
            placeholder="Enter professor name..."
            className="w-full h-12 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none pr-20 text-black"
          />

          <button type="submit" className="absolute right-0 top-0 h-12 w-14 bg-gray-700 rounded-r-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
        </form>

        <div className="w-6/12 mt-20 flex flex-col items-start">
          <div className="w-full">
            <h3 className="text-2xl text-black font-semibold">Recently Searched</h3>
          </div>

          {recent.length === 0 ? (
            <div className="mt-2 text-sm text-gray-500">No recent searches yet.</div>
          ) : (
            <div className="mt-2 flex flex-wrap gap-10">
              {recent.map((r) => (
              <button
              key={r}
              type="button"
              onClick={() => {
              saveRecent(r)
              navigate(`/results?query=${encodeURIComponent(r)}`)
              }}
              className="border border-gray-200 border-1 mt-4 px-5 py-3 bg-gray-50 text-lg text-black rounded-small hover:bg-gray-200 flex items-center justify-between"
              style={{ minWidth: '13.6rem', minHeight: '4rem', maxWidth: '12rem' }}
              >
              <span className="truncate">{r}</span>
              <img src="/src/assets/go.svg" alt="Back" className="h-5 w-5" />
              </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}