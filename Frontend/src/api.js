import axios from 'axios'

const BASE_URL = 'http://localhost:8000'

export async function setTopic(topic) {
  const response = await axios.post(`${BASE_URL}/topic`, { topic })
  return response.data
}

export async function getContext() {
  const response = await axios.get(`${BASE_URL}/context`)
  return response.data
}

export async function runScraper() {
  const response = await axios.post(`${BASE_URL}/run-scraper`)
  return response.data
}

export async function runClaims() {
  const response = await axios.post(`${BASE_URL}/run-claims`)
  return response.data
}

export async function runNarratives() {
  const response = await axios.post(`${BASE_URL}/run-narratives`)
  return response.data
}

export async function runGraph() {
  const response = await axios.post(`${BASE_URL}/run-graph`)
  return response.data
}
