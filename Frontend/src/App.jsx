import { useState } from 'react'
import TopicInput from './components/TopicInput'
import NarrativeList from './components/NarrativeList'
import GraphView from './components/GraphView'
import { runScraper, runClaims, runNarratives, runGraph } from './api'

export default function App() {
  const [topic, setTopic] = useState('')
  const [narratives, setNarratives] = useState([])

  async function handleAnalyze(submittedTopic) {
    setTopic(submittedTopic)
    setNarratives([])
    await runScraper()
    await runClaims()
    await runNarratives()
    await runGraph()
  }

  return (
    <div style={{ maxWidth: '800px', margin: '3rem auto', fontFamily: 'sans-serif', padding: '0 1rem' }}>
      <h1>EpiMinds — Narrative Map</h1>
      <TopicInput onAnalyze={handleAnalyze} />
      <NarrativeList narratives={narratives} topic={topic} />
      <GraphView />
    </div>
  )
}
