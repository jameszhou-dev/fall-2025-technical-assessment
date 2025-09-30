import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'

type Professor = {
  id?: number | string
  first_name?: string
  last_name?: string
  full_name?: string
  department?: string
  name?: string
  slug?: string
  courses?: string[]
  average_rating?: number | null
}

function useQuery() {
  return new URLSearchParams(useLocation().search)
}

export default function ResultsPage() {
    const urlQuery = useQuery()
    const name = (urlQuery.get('name') || '').trim()
    const query = (urlQuery.get('query') || '').trim()
    const navigate = useNavigate()

    const [search, setSearch] = useState(query || name)

    const [profs, setProfs] = useState<Professor[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false

        async function fetchProfs() {
            setLoading(true)
            setError(null)
            const paramKey = query ? 'query' : name ? 'name' : ''
            const paramVal = query || name
            const paramStr = paramKey ? `?${paramKey}=${encodeURIComponent(paramVal)}` : ''
            const primary = `http://localhost:3000/fetch-prof-info${paramStr}`
            const fallback = `/fetch-prof-info${paramStr}`

            async function tryFetch(url: string) {
                try {
                    const res = await fetch(url)
                    if (!res.ok) throw new Error(`Server returned ${res.status}`)
                    const data = await res.json()
                    return { ok: true, data }
                } catch (err: any) {
                    return { ok: false, error: err }
                }
            }

            const a = await tryFetch(primary)
            const final = a.ok ? a : await (async () => {
                const b = await tryFetch(fallback)
                return b.ok ? b : a
            })()

            if (!final.ok) {
                const err = final.error
                const msg = err?.message || String(err) || 'Unknown error'
                if (!cancelled)
                    setError(
                        `Failed to fetch: ${msg}. Is the proxy server running? Try: npm install express axios cors && node server.js`,
                    )

                if (!cancelled) setLoading(false)
                return
            }

            try {
                const payload = final.data
                let list: Professor[] = []

                if (Array.isArray(payload)) {
                    list = payload
                } else if (Array.isArray(payload?.data)) {
                    list = payload.data
                } else if (payload && (payload.type === 'professor' || payload.name)) {
                    list = [payload]
                } else {
                    list = []
                }

                if (!cancelled) setProfs(list)
            } catch (parseErr: any) {
                if (!cancelled) setError('Failed to parse response from server')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        fetchProfs()
        return () => {
            cancelled = true
        }
    }, [name, query])

    const activeTerm = query || name
    const filtered = activeTerm
        ? profs.filter((p: Professor) => {
                const full = (p.full_name || p.name || `${p.first_name || ''} ${p.last_name || ''}`).toLowerCase()
                return full.includes(activeTerm.toLowerCase())
            })
        : profs

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const trimmed = search.trim()
        if (!trimmed) return
        navigate(`/results?query=${encodeURIComponent(trimmed)}`)
    }

    return (
        <div className="h-screen w-screen flex flex-col bg-white">
            
            <div className="w-full mx-auto pt-10 mt-8">
                <div className="flex items-center w-full">

                    <div className="w-1/6 flex justify-start">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            aria-label="Go back"
                            className="text-black text-lg font-normal bg-transparent px-10 py-2 hover:bg-gray-100 rounded flex items-center"
                        >
                            <img src="/src/assets/back.svg" alt="Back" className="h-8 w-8 mr-2" />
                            Return
                        </button>
                    </div>

                    <div className="w-4/6 flex-grow flex justify-center">
                        <form onSubmit={handleSubmit} className="w-full">
                            <div className="relative">
                                <input
                                    value={search}
                                    onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
                                    type="text"
                                    placeholder="Enter professor name..."
                                    className="w-full h-12 px-4 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none text-black pr-10"
                                />
                                <button type="submit" className="absolute inset-y-0 right-0 rounded-none rounded-r-xl flex items-center pr-3">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="w-1/6 flex justify-end"></div>
                </div>
            </div>

            <div className="pt-20 flex justify-center">

                <div className="w-4/6">
                    <h2 className="text-2xl font-bold mb-4 text-black">Search Results</h2>

                        {loading && <p>Loading professors…</p>}
                        {error && (
                            <div className="text-red-600">
                                <p>Error: {error}</p>
                                <p className="mt-2 text-sm text-gray-700">Tip: start the proxy from the project root:</p>
                                <pre className="bg-gray-100 p-2 rounded mt-1">npm install express axios cors && node server.js</pre>
                            </div>
                        )}

                        {!loading && !error && filtered.length === 0 && (
                            <p>No professors found{ name ? ` matching "${name}"` : '' }.</p>
                        )}

                        <ul className="grid grid-cols-1 gap-0">
                            {filtered.map((p) => (
                                <li key={p.id ?? `${p.first_name}-${p.last_name}`} className="p-4 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-lg font-semibold text-black">{p.full_name ?? p.name ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`}</div>
                                            {p.department && <div className="text-sm text-gray-500">{p.department}</div>}
                                            {p.courses && p.courses.length > 0 && (
                                                <div className="mt-2 text-sm text-gray-700">Courses: {p.courses.join(', ')}</div>
                                            )}
                                            {p.average_rating !== undefined && (
                                                <div className="mt-1 text-sm text-gray-600">Average rating: {p.average_rating ?? 'N/A'}</div>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                </div>
            </div>

        </div>
    )
}