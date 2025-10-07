import express from 'express'
import axios from 'axios'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())


app.get('/', (req, res) => {
  res.json({ ok: true, message: 'PlanetTerp proxy running' })
})

app.get('/fetch-prof-info', async (req, res) => {
  const name = (req.query.name || '').toString()
  const queryParam = (req.query.query || '').toString()
  try {
    function normalizeProfessor(item) {
      if (!item) return null

      if (item.professor) item = item.professor
      if (item.data && item.data.attributes) item = { ...item.data.attributes, id: item.data.id ?? item.data.attributes.id }
      if (item.attributes) item = { ...item.attributes, id: item.id ?? item.attributes.id }

      const first = item.first_name || item.firstName || ''
      const last = item.last_name || item.lastName || ''
      const nameVal = item.full_name || item.fullName || item.name || `${first} ${last}`.trim() || null

      const avg = item.average_rating ?? item.averageRating ?? item.avg_rating ?? item.rating ?? null

      const courses = item.courses ?? item.course_list ?? item.courses_list ?? null

      return {
        id: item.id ?? null,
        name: nameVal,
        average_rating: avg,
        slug: item.slug ?? item.slugName ?? null,
        courses: Array.isArray(courses) ? courses : typeof courses === 'string' ? [courses] : [],
      }
    }

    if (queryParam) {
      const searchResp = await axios.get('https://planetterp.com/api/v1/search', {
        params: { query: queryParam, limit: 100 },
        timeout: 10000,
      })
      const raw = searchResp.data
      const list = Array.isArray(raw)
        ? raw.map(normalizeProfessor).filter(Boolean)
        : Array.isArray(raw?.data)
        ? raw.data.map(normalizeProfessor).filter(Boolean)
        : []
      async function enrich(list) {
        const need = list.filter((x) => (x.average_rating == null) && x.name)
        const cap = 10
        const toFetch = need.slice(0, cap)
        await Promise.all(
          toFetch.map(async (item) => {
            try {
              const r = await axios.get('https://planetterp.com/api/v1/professor', { params: { name: item.name }, timeout: 10000 })
              const n = normalizeProfessor(r.data)
              if (n) {
                item.average_rating = n.average_rating
                item.courses = n.courses
                item.slug = item.slug || n.slug
              }
            } catch (e) {
            }
          })
        )
      }

      await enrich(list)
      return res.json({ data: list })
    }

    if (name) {
      try {
        const response = await axios.get('https://planetterp.com/api/v1/professor', {
          params: { name },
          timeout: 10000,
        })
        const normalized = normalizeProfessor(response.data)
        return res.json({ data: normalized ? [normalized] : [] })
      } catch (err) {
        const status = err?.response?.status
        const body = err?.response?.data
        const message = body?.error || body
        if (status === 400 && typeof message === 'object' && (message.error || '').toString().toLowerCase().includes('not found')) {
          const searchResp = await axios.get('https://planetterp.com/api/v1/search', {
            params: { query: name, limit: 100 },
            timeout: 10000,
          })
          const raw = searchResp.data
          const list = Array.isArray(raw)
            ? raw.map(normalizeProfessor).filter(Boolean)
            : Array.isArray(raw?.data)
            ? raw.data.map(normalizeProfessor).filter(Boolean)
            : []
          // enrich a few missing ratings
          async function enrich(list) {
            const need = list.filter((x) => (x.average_rating == null) && x.name)
            const cap = 10
            const toFetch = need.slice(0, cap)
            await Promise.all(
              toFetch.map(async (item) => {
                try {
                  const r = await axios.get('https://planetterp.com/api/v1/professor', { params: { name: item.name }, timeout: 10000 })
                  const n = normalizeProfessor(r.data)
                  if (n) {
                    item.average_rating = n.average_rating
                    item.courses = n.courses
                    item.slug = item.slug || n.slug
                  }
                } catch (e) {}
              })
            )
          }

          await enrich(list)
          return res.json({ data: list })
        }
        throw err
      }
    }
    const response = await axios.get('https://planetterp.com/api/v1/professors', {
      params: { limit: 100 },
      timeout: 10000,
    })
    const raw = response.data
    const list = Array.isArray(raw)
      ? raw.map(normalizeProfessor).filter(Boolean)
      : Array.isArray(raw?.data)
      ? raw.data.map(normalizeProfessor).filter(Boolean)
      : []
    return res.json({ data: list })
  } catch (error) {
    console.error('/fetch-prof-info error', (error && error.response && error.response.data) || error?.message || error)
    const status = error?.response?.status || 500
    return res.status(status).json({ error: error?.response?.data || error?.message || 'Failed to fetch from PlanetTerp' })
  }
})

app.get('/fetch-course-info', async (req, res) => {
  const name = (req.query.name || '').toString().trim()
  const department = (req.query.department || '').toString().trim()
  const reviewsFlag = req.query.reviews === 'true' || req.query.reviews === true
  const limit = Number(req.query.limit ?? 100)
  const offset = Number(req.query.offset ?? 0)

  try {
    function computeAverageFromReviews(reviews) {
      if (!Array.isArray(reviews)) return null
      const vals = reviews
        .map((r) => r.rating ?? r.score ?? r.value ?? r.rating_value ?? null)
        .filter((v) => v != null && !Number.isNaN(Number(v)))
        .map((v) => Number(v))
      if (vals.length === 0) return null
      return vals.reduce((a, b) => a + b, 0) / vals.length
    }

    function normalizeCourse(item) {
      if (!item) return null
      // PlanetTerp single-course format uses keys shown in docs
      const department = item.department ?? item.dept ?? null
      const course_number = item.course_number ?? item.number ?? null
      const title = item.title ?? item.name ?? null
      const description = item.description ?? null
      const credits = item.credits ?? null
      const average_gpa = item.average_gpa ?? null
      const professors = Array.isArray(item.professors) ? item.professors : item.professors ? [item.professors] : []

      // Some endpoints include reviews array when reviews=true
      const reviews = Array.isArray(item.reviews) ? item.reviews : null
      const average_rating = computeAverageFromReviews(reviews)

      return {
        department,
        course_number,
        title,
        description,
        credits,
        average_gpa,
        average_rating,
        professors,
        raw: item,
      }
    }

    // If a name is provided, fetch the single-course endpoint and ask for reviews when requested
    if (name) {
      const params = { name }
      if (reviewsFlag) params.reviews = true
      const response = await axios.get('https://planetterp.com/api/v1/course', { params, timeout: 10000 })
      const raw = response.data
      const item = Array.isArray(raw) ? raw[0] : raw
      const normalized = normalizeCourse(item)
      return res.json({ data: normalized ? [normalized] : [] })
    }

    // Otherwise return a list of courses from /courses (support department, reviews, pagination)
    const listParams = { limit: Number.isFinite(limit) ? limit : 100, offset: Number.isFinite(offset) ? offset : 0 }
    if (department) listParams.department = department
    if (reviewsFlag) listParams.reviews = true

    const response = await axios.get('https://planetterp.com/api/v1/courses', { params: listParams, timeout: 10000 })
    const raw = response.data
    const items = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []
    const list = items.map(normalizeCourse).filter(Boolean)
    return res.json({ data: list })
  } catch (error) {
    console.error('/fetch-course-info error', (error && error.response && error.response.data) || error?.message || error)
    const status = error?.response?.status || 500
    return res.status(status).json({ error: error?.response?.data || error?.message || 'Failed to fetch courses' })
  }
})

// Fetch grade distribution for a course, optionally by professor
app.get('/fetch-course-grades', async (req, res) => {
  const course = (req.query.course || '').toString().trim()
  const professor = (req.query.professor || '').toString().trim()
  try {
    if (!course) return res.status(400).json({ error: 'course query param is required' })

    const params = { course }
    if (professor) params.professor = professor

    const response = await axios.get('https://planetterp.com/api/v1/grades', { params, timeout: 10000 })
    const raw = response.data // expected to be an array of grade objects

    // Aggregate counts and compute weighted average GPA
    const gradeToValue = {
      'A+': 4.0,
      A: 4.0,
      'A-': 3.7,
      'B+': 3.3,
      B: 3.0,
      'B-': 2.7,
      'C+': 2.3,
      C: 2.0,
      'C-': 1.7,
      'D+': 1.3,
      D: 1.0,
      'D-': 0.7,
      F: 0.0,
    }

    // raw may be an array of sections; aggregate all counts
    const aggregate = {}
    let totalCount = 0
    for (const rec of Array.isArray(raw) ? raw : [raw]) {
      Object.keys(rec).forEach((k) => {
        if (['course', 'professor', 'semester', 'section'].includes(k)) return
        const v = rec[k]
        const count = Number(v) || 0
        aggregate[k] = (aggregate[k] || 0) + count
        totalCount += count
      })
    }

    // compute weighted average GPA
    let totalPoints = 0
    Object.entries(aggregate).forEach(([grade, count]) => {
      const val = gradeToValue[grade] ?? null
      if (val != null) totalPoints += val * (Number(count) || 0)
    })
    const average_gpa = totalCount > 0 ? totalPoints / totalCount : null

    return res.json({ data: [{ course, professor: professor || null, average_gpa, distribution: aggregate, total: totalCount, raw }] })
  } catch (err) {
    console.error('/fetch-course-grades error', err?.response?.data || err?.message || err)
    const status = err?.response?.status || 500
    return res.status(status).json({ error: err?.response?.data || err?.message || 'Failed to fetch grades' })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})