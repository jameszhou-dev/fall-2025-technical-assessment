export type Professor = {
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

import { useEffect, useRef, useState } from 'react'

export default function ProfessorCard({ prof }: { prof: Professor }) {
  const title = prof.full_name || prof.name || `${prof.first_name ?? ''} ${prof.last_name ?? ''}`.trim()
  const [localProf, setLocalProf] = useState<Professor>(prof)
  const rating = localProf.average_rating
  const ratingDisplay = rating != null && !Number.isNaN(Number(rating)) ? Number(rating).toFixed(1) : null
  const [flipped, setFlipped] = useState(false)

  const rootRef = useRef<HTMLDivElement | null>(null)
  const fetchedRef = useRef(false)
  const [enriching, setEnriching] = useState(false)
  const attemptsRef = useRef(0)
  const MAX_ATTEMPTS = 3

  useEffect(() => {
    setLocalProf(prof)
    fetchedRef.current = false
  }, [prof])

  useEffect(() => {
    if (localProf.average_rating != null) return

    const el = rootRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && attemptsRef.current < MAX_ATTEMPTS) {
          attemptsRef.current += 1
          setEnriching(true)
          console.debug('ProfessorCard: attempting enrichment', { title, attempt: attemptsRef.current })

          const encoded = encodeURIComponent(title)
          const candidates = [
            `http://localhost:3000/fetch-prof-info?name=${encoded}`,
            `http://localhost:3000/fetch-prof-info?query=${encoded}`,
            `/fetch-prof-info?name=${encoded}`,
            `/fetch-prof-info?query=${encoded}`,
          ]

          const doFetch = async (url: string) => {
            try {
              const r = await fetch(url)
              if (!r.ok) throw new Error(`status:${r.status}`)
              return await r.json()
            } catch (e) {
              console.debug('ProfessorCard: fetch failed', { url, err: e })
              return null
            }
          }

          ;(async () => {
            try {
              let data = null
              for (const u of candidates) {
                data = await doFetch(u)
                if (data) break
              }
              if (data && Array.isArray(data.data) && data.data.length > 0) {
                const p = data.data[0]
                setLocalProf((prev) => ({ ...prev, ...p }))
                // if we got a rating, mark as fetched so we don't retry
                if (p && p.average_rating != null) {
                  fetchedRef.current = true
                } else {
                  if (attemptsRef.current >= MAX_ATTEMPTS) fetchedRef.current = true
                  else fetchedRef.current = false
                }
                console.debug('ProfessorCard: enrichment result', { title, foundRating: p.average_rating != null })
              } else {
                if (attemptsRef.current >= MAX_ATTEMPTS) fetchedRef.current = true
                else fetchedRef.current = false
                console.debug('ProfessorCard: enrichment returned no data', { title })
              }
            } finally {
              setEnriching(false)
            }
          })()
        }
      })
    }, { rootMargin: '400px' })

    obs.observe(el)
    return () => obs.disconnect()
  }, [localProf.average_rating, title])

  return (
    <div ref={rootRef} className="relative" style={{ width: '100%', height: '22rem', perspective: 1000 }}>
      <div
        className="w-full h-full"
        style={{ position: 'relative', transformStyle: 'preserve-3d', transition: 'transform 0.6s', transform: flipped ? 'rotateY(180deg)' : 'none' }}
      >
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col h-full">
            <div className="bg-gray-200 w-full flex items-center justify-center" style={{ height: '66%' }}>
              <svg className="w-3/4 h-3/4 text-gray-300" viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <rect width="200" height="140" rx="8" fill="currentColor" />
              </svg>
            </div>

            <div className="p-4 flex flex-col justify-between" style={{ height: '34%' }}>
              <div>
                <div className="text-lg font-semibold text-black truncate">{title}</div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-lg font-medium text-gray-800">{enriching ? '...' : ratingDisplay ?? 'N/A'}</div>
                  <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <polygon points="12,17.27 18.18,21 16.54,13.97 22,9.24 14.81,8.63 12,2 9.19,8.63 2,9.24 7.46,13.97 5.82,21" />
                  </svg>
                </div>

                <button
                  type="button"
                  onClick={() => setFlipped(true)}
                  className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm text-black"
                >
                  View classes
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Back face (absolute) */}
        <div style={{ position: 'absolute', inset: 0, transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
          <div className="h-full flex flex-col rounded-lg shadow-sm border overflow-hidden" style={{ background: 'linear-gradient(180deg,#f3f4f6,#ffffff)' }}>
            <div className="p-4 border-b">
              <div className="text-lg font-bold text-gray-800">Classes taught</div>
              <div className="text-sm text-gray-600">by {title}</div>
            </div>

            <div className="p-4 flex-1 overflow-auto">
              {localProf.courses && localProf.courses.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {localProf.courses.map((c) => (
                    <CourseItem key={c} courseName={c} profName={title} />
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No classes available</div>
              )}
            </div>

            <div className="p-4 border-t flex justify-end">
              <button type="button" onClick={() => setFlipped(false)} className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-indigo-700 text-sm">Back</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CourseItem({ courseName, profName }: { courseName: string; profName?: string }) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [details, setDetails] = useState<any>(null)
  const [gradesInfo, setGradesInfo] = useState<any>(null)

  async function fetchDetails() {
    setLoading(true)
    try {
      const encoded = encodeURIComponent(courseName)
      const candidates = [
        `http://localhost:3000/fetch-course-info?name=${encoded}`,
        `/fetch-course-info?name=${encoded}`,
      ]
      let payload: any = null
      for (const u of candidates) {
        try {
          const r = await fetch(u)
          if (!r.ok) throw new Error(`status:${r.status}`)
          const json = await r.json()
          if (json) {
            payload = json
            break
          }
        } catch (e) {
          // try next
        }
      }

      if (payload) {
        const item = Array.isArray(payload) ? payload[0] : Array.isArray(payload?.data) ? payload.data[0] : payload?.data || payload
        setDetails(item)
      }
      // If the course details include average_gpa, prefer that and skip the grades endpoint
      if (payload) {
        const item = Array.isArray(payload) ? payload[0] : Array.isArray(payload?.data) ? payload.data[0] : payload?.data || payload
        if (item && (item.average_gpa != null || item.averageGPA != null)) {
          const avg = item.average_gpa ?? item.averageGPA ?? null
          setGradesInfo({ average_gpa: avg, distribution: item.reviews ?? null })
        } else {
          // fetch grades (average GPA) for this course for this professor if details didn't include it
          try {
            const encodedCourse = encodeURIComponent(courseName)
            const encodedProf = profName ? encodeURIComponent(profName) : undefined
            const gradeCandidates = encodedProf
              ? [
                  `http://localhost:3000/fetch-course-grades?course=${encodedCourse}&professor=${encodedProf}`,
                  `/fetch-course-grades?course=${encodedCourse}&professor=${encodedProf}`,
                  `http://localhost:3000/fetch-course-grades?course=${encodedCourse}`,
                  `/fetch-course-grades?course=${encodedCourse}`,
                ]
              : [
                  `http://localhost:3000/fetch-course-grades?course=${encodedCourse}`,
                  `/fetch-course-grades?course=${encodedCourse}`,
                ]

            let gpayload: any = null
            for (const u of gradeCandidates) {
              try {
                const r = await fetch(u)
                if (!r.ok) throw new Error(`status:${r.status}`)
                const json = await r.json()
                if (json) {
                  gpayload = json
                  break
                }
              } catch (e) {
                // try next
              }
            }

            if (gpayload && Array.isArray(gpayload.data) && gpayload.data.length > 0) {
              setGradesInfo(gpayload.data[0])
            }
          } catch (e) {
            // ignore
          }
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-3 bg-white rounded shadow-sm border">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-800">{courseName}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              if (!expanded && !details && !gradesInfo) await fetchDetails()
              setExpanded((s) => !s)
            }}
            className="px-2 py-1 bg-gray-100 rounded text-sm text-black"
          >
            {expanded ? 'Collapse' : 'Details'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 text-sm text-gray-700">
          {loading && <div>Loading…</div>}
          {!loading && (
            <div>
              {gradesInfo && gradesInfo.average_gpa != null ? (
                <div className="font-medium">Average GPA: {Number(gradesInfo.average_gpa).toFixed(3)}</div>
              ) : (
                <div>No grade data</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
