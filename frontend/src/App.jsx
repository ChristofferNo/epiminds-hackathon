import { useState } from 'react'
import TopicInput from './components/TopicInput'
import NarrativeList from './components/NarrativeList'
import GraphView from './components/GraphView'

export default function App() {
  const [topic, setTopic] = useState('')
  const [narratives, setNarratives] = useState([])

  function handleAnalyze(submittedTopic) {
    setTopic(submittedTopic)
    setNarratives([])
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
