import { useState } from 'react'
import { setTopic } from '../api'

export default function TopicInput({ onAnalyze }) {
  const [topic, setTopicValue] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!topic.trim()) return
    setLoading(true)
    try {
      await setTopic(topic.trim())
      onAnalyze(topic.trim())
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
      <h2>Enter Topic</h2>
      <input
        type="text"
        value={topic}
        onChange={(e) => setTopicValue(e.target.value)}
        placeholder="e.g. mRNA vaccines"
        style={{ padding: '0.5rem', width: '300px', marginRight: '1rem' }}
      />
      <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem' }}>
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>
    </form>
  )
}
