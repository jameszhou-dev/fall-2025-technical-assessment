import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

type Professor = {
  id?: number | string
  first_name?: string
  last_name?: string
  full_name?: string
  department?: string
}

function useQuery() {
  return new URLSearchParams(useLocation().search)
}

export default function ResultsPage() {
  const query = useQuery()
  const name = (query.get('name') || '').trim()

  const [profs, setProfs] = useState<Professor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchProfs() {
      setLoading(true)
      setError(null)

      const primary = 'http://localhost:3000/fetch-prof-info'
      const fallback = '/fetch-prof-info'

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

      // Try primary (explicit local proxy) first, then fallback to relative path
      const a = await tryFetch(primary)
      let final
      if (a.ok) final = a
      else {
        const b = await tryFetch(fallback)
        final = b.ok ? b : a // prefer fallback only if ok
      }

      if (!final.ok) {
        // make the error message more actionable
        const err = final.error
        const msg = err?.message || String(err) || 'Unknown error'
        if (!cancelled) setError(`Failed to fetch: ${msg}. Is the proxy server running? Try: npm install express axios cors && node server.js`) 
        
        if (!cancelled) setLoading(false)
        return
      }

      try {
        const list: Professor[] = Array.isArray(final.data) ? final.data : final.data?.data || []
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
  }, [])

  const filtered = name
    ? profs.filter((p: Professor) => {
        const full = (p.full_name || `${p.first_name || ''} ${p.last_name || ''}`).toLowerCase()
        return full.includes(name.toLowerCase())
      })
    : profs

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Search results{ name ? ` for "${name}"` : '' }</h2>

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

        <ul className="grid grid-cols-1 gap-4">
          {filtered.map((p) => (
            <li key={p.id ?? `${p.first_name}-${p.last_name}`} className="bg-white p-4 rounded shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">{p.full_name ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`}</div>
                  {p.department && <div className="text-sm text-gray-500">{p.department}</div>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}