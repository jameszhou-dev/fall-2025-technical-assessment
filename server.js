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
    if (queryParam) {
      const searchResp = await axios.get('https://planetterp.com/api/v1/search', {
        params: { query: queryParam, limit: 100 },
        timeout: 10000,
      })
      return res.json(searchResp.data)
    }

    if (name) {
      try {
        const response = await axios.get('https://planetterp.com/api/v1/professor', {
          params: { name },
          timeout: 10000,
        })
        return res.json(response.data)
      } catch (err) {
        const status = err?.response?.status
        const body = err?.response?.data
        const message = body?.error || body
        if (status === 400 && typeof message === 'object' && (message.error || '').toString().toLowerCase().includes('not found')) {
          const searchResp = await axios.get('https://planetterp.com/api/v1/search', {
            params: { query: name, limit: 100 },
            timeout: 10000,
          })
          return res.json(searchResp.data)
        }
        throw err
      }
    }

    // PlanetTerp enforces a maximum `limit` of 100 — keep requests within that bound
    const response = await axios.get('https://planetterp.com/api/v1/professors', {
      params: { limit: 100 },
      timeout: 10000,
    })
    return res.json(response.data)
  } catch (error) {
    console.error('/fetch-prof-info error', (error && error.response && error.response.data) || error?.message || error)
    const status = error?.response?.status || 500
    return res.status(status).json({ error: error?.response?.data || error?.message || 'Failed to fetch from PlanetTerp' })
  }
})

app.get('/fetch-course-info', async (req, res) => {
  const name = (req.query.name || '').toString()
  try {
    if (name) {
      const response = await axios.get('https://planetterp.com/api/v1/course', { params: { name }, timeout: 10000 })
      return res.json(response.data)
    }

  // PlanetTerp enforces a maximum `limit` of 100
  const response = await axios.get('https://planetterp.com/api/v1/courses', { params: { limit: 100 }, timeout: 10000 })
    return res.json(response.data)
  } catch (error) {
    console.error('/fetch-course-info error', (error && error.response && error.response.data) || error?.message || error)
    const status = error?.response?.status || 500
    return res.status(status).json({ error: error?.response?.data || error?.message || 'Failed to fetch courses' })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})