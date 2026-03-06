import { useState, useRef } from 'react'
import TopicInput from './components/TopicInput'
import NarrativeList from './components/NarrativeList'
import GraphView from './components/GraphView'
import { setTopic as apiSetTopic, getContext } from './api'

export default function App() {
  const [topic, setTopic] = useState('')
  const [narratives, setNarratives] = useState([])
  const pollRef = useRef(null)

  async function handleAnalyze(submittedTopic) {
    setTopic(submittedTopic)
    setNarratives([])

    await apiSetTopic(submittedTopic)

    if (pollRef.current) clearInterval(pollRef.current)

    pollRef.current = setInterval(async () => {
      const ctx = await getContext()
      if (ctx.narratives?.length > 0) {
        setNarratives(ctx.narratives)
      }
      if (ctx.graph?.nodes?.length > 0) {
        clearInterval(pollRef.current)
      }
    }, 2000)
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
