import fetch from 'node-fetch'

async function run() {
  const url = 'http://localhost:3000/fetch-prof-info?name=Adam%20Nixon'
  try {
    const res = await fetch(url)
    console.log('status', res.status)
    const data = await res.text()
    console.log(data)
  } catch (err) {
    console.error('fetch error', err)
  }
}

run()
