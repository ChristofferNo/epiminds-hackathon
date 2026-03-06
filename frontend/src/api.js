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
