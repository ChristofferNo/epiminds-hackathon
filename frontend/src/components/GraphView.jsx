import { useEffect, useState } from 'react'
import ReactFlow, { Background, Controls } from 'reactflow'
import 'reactflow/dist/style.css'
import { getContext } from '../api'

const typeColors = {
  source: '#3b82f6',
  claim: '#f97316',
  narrative: '#22c55e',
}

function buildLayoutedNodes(nodes) {
  const byType = { source: [], claim: [], narrative: [] }
  for (const n of nodes) {
    const t = n.type in byType ? n.type : 'claim'
    byType[t].push(n)
  }

  const colX = { source: 100, claim: 420, narrative: 740 }
  const result = []

  for (const [type, group] of Object.entries(byType)) {
    group.forEach((node, i) => {
      result.push({
        id: node.id,
        data: { label: node.label },
        position: { x: colX[type], y: 80 + i * 90 },
        style: {
          background: typeColors[type] || '#888',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 12,
          maxWidth: 180,
          wordBreak: 'break-word',
        },
      })
    })
  }

  return result
}

export default function GraphView() {
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function loadGraph() {
    setLoading(true)
    setError(null)
    try {
      const context = await getContext()
      const graph = context.graph
      if (!graph || !graph.nodes?.length) {
        setError('No graph data yet. Run the analysis first.')
        return
      }

      const rfNodes = buildLayoutedNodes(graph.nodes)
      const rfEdges = graph.edges.map((edge, i) => ({
        id: 'e' + i,
        source: edge.source,
        target: edge.target,
        animated: true,
        style: { stroke: '#94a3b8' },
      }))

      setNodes(rfNodes)
      setEdges(rfEdges)
    } catch {
      setError('Could not load graph from backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGraph()
  }, [])

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
        <h2 style={{ margin: 0 }}>Narrative Graph</h2>
        <button onClick={loadGraph} style={{ padding: '4px 12px', cursor: 'pointer' }}>
          Refresh
        </button>
        <span style={{ fontSize: 12, color: '#888' }}>
          <span style={{ color: typeColors.source }}>■</span> Source &nbsp;
          <span style={{ color: typeColors.claim }}>■</span> Claim &nbsp;
          <span style={{ color: typeColors.narrative }}>■</span> Narrative
        </span>
      </div>

      {loading && <p style={{ color: '#888' }}>Loading graph…</p>}
      {error && !loading && <p style={{ color: '#f97316' }}>{error}</p>}

      {!loading && !error && nodes.length > 0 && (
        <div style={{ height: 500, border: '1px solid #e2e8f0', borderRadius: 8 }}>
          <ReactFlow nodes={nodes} edges={edges} fitView>
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      )}
    </div>
  )
}
