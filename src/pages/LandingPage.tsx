import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    navigate(`/results?name=${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="h-[45%] w-full bg-[url('/src/assets/Figma.png')] bg-cover bg-center relative">
        <h1 className="absolute top-24 left-40 text-white text-5xl font-bold drop-shadow-lg max-w-md whitespace-normal">Find My Professor</h1>
        <p className="absolute top-48 left-40 text-white text-xl drop-shadow-lg max-w-lg whitespace-normal leading-relaxed">Want to know more about the professors here at UMD? This is the perfect place to learn a bit about the courses they teach and their grade distributions.</p>
      </div>

      <div className="h-[55%] w-full bg-white flex flex-col items-center pt-16">
        <h1 className="text-black text-4xl font-semibold drop-shadow-lg">Enter a Professor to start...</h1>

        <form onSubmit={handleSubmit} className="relative w-7/12 mt-8">
          <input
            value={query}
            onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
            type="text"
            placeholder="Enter professor name..."
            className="w-full h-12 px-4 py-2 bg-white border border-gray-300 rounded-none rounded-r-lg focus:outline-none pr-20 text-black"
          />

          <button type="submit" className="absolute right-0 top-0 h-12 w-14 bg-gray-700 rounded-r-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}