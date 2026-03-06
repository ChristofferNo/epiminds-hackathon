export default function NarrativeList({ narratives, topic }) {
  const placeholders = ['Narrative A', 'Narrative B', 'Narrative C']
  const items = narratives.length > 0 ? narratives : (topic ? placeholders : [])

  if (!topic) return null

  return (
    <div>
      <h2>Narratives discovered</h2>
      <ul>
        {items.map((n, i) => (
          <li key={i}>{typeof n === 'string' ? n : n.label}</li>
        ))}
      </ul>
    </div>
  )
}
