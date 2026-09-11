import { useState } from 'react'

type TableName =
  | 'channels'
  | 'events'
  | 'messages'
  | 'sources'
  | 'channel-connections'

const TABLES: TableName[] = [
  'channels',
  'events',
  'messages',
  'sources',
  'channel-connections',
]

const API_BASE = 'http://localhost:8000/api/v1'
const PAGE_SIZE = 100

interface PaginatedResponse {
  count: number
  next: string | null
  previous: string | null
  results: Record<string, unknown>[]
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(6)
  }
  return String(value)
}

function App() {
  const [selected, setSelected] = useState<TableName>('channels')
  const [data, setData] = useState<PaginatedResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const fetchPage = async (url: string, pageNumber: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
      const json: PaginatedResponse = await res.json()
      setData(json)
      setPage(pageNumber)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleFetch = () => fetchPage(`${API_BASE}/${selected}/`, 1)

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0
  const columns =
    data && data.results.length > 0 ? Object.keys(data.results[0]) : []

  const Pagination = () => (
    <div className="d-flex justify-content-center align-items-center gap-2 my-3">
      <button
        className="btn btn-outline-secondary"
        onClick={() => data?.previous && fetchPage(data.previous, page - 1)}
        disabled={!data?.previous || loading}
      >
        ← Prev
      </button>
      <span className="text-body-secondary">
        Page <strong>{page}</strong> of <strong>{totalPages}</strong>
      </span>
      <button
        className="btn btn-outline-secondary"
        onClick={() => data?.next && fetchPage(data.next, page + 1)}
        disabled={!data?.next || loading}
      >
        Next →
      </button>
    </div>
  )

  return (
    <div className="container py-4" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <h1 className="mb-4 fs-3">Social Media Explorer</h1>

      <div className="d-flex align-items-center gap-2 mb-4">
        <select
          className="form-select w-auto"
          value={selected}
          onChange={(e) => setSelected(e.target.value as TableName)}
        >
          {TABLES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button
          className="btn btn-primary"
          onClick={handleFetch}
          disabled={loading}
        >
          Fetch
        </button>
        {data && (
          <span className="text-body-secondary ms-auto">
            Total rows: <strong>{data.count.toLocaleString()}</strong>
          </span>
        )}
      </div>

      {loading && (
        <div className="alert alert-secondary py-2">Loading…</div>
      )}
      {error && (
        <div className="alert alert-danger py-2">Error: {error}</div>
      )}

      {data && (
        <>
          <Pagination />

          <div className="table-responsive">
            <table className="table table-bordered table-striped table-hover align-middle mb-0" style={{ tableLayout: 'fixed' }}>
              <thead className="table-secondary">
                <tr>
                  {columns.map((c) => (
                    <th key={c} className="text-start text-nowrap">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.results.map((row, i) => (
                  <tr key={i}>
                    {columns.map((c) => (
                      <td key={c} className="text-start text-truncate">
                        {formatCell(row[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination />
        </>
      )}
    </div>
  )
}

export default App
