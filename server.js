import express from 'express'
import axios from 'axios'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/fetch-prof-info', async (req, res) => {
  try {
    const response = await axios.get('https://planetterp.com/api/v1/professor', { timeout: 10000 })
    return res.json(response.data)
  } catch (error) {
    console.error('/fetch-prof-info error', (error && error.response && error.response.data) || error?.message || error)
    const status = error?.response?.status || 500
    return res.status(status).json({ error: 'Failed to fetch professor info' })
  }
})

app.get('/fetch-course-info', async (req, res) => {
  try {
    const response = await axios.get('https://planetterp.com/api/v1/course', { timeout: 10000 })
    return res.json(response.data)
  } catch (error) {
    console.error('/fetch-course-info error', (error && error.response && error.response.data) || error?.message || error)
    const status = error?.response?.status || 500
    return res.status(status).json({ error: 'Failed to fetch course info' })
  }
})

app.get('/', (req, res) => {
  res.json({ ok: true })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})