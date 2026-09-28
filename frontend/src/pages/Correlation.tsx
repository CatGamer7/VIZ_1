import { Fragment, useEffect, useState } from 'react'
import Plot from '../lib/Plot'
import {
  API_BASE,
  TABLES,
  type TableName,
  fetchOptions,
  numericFields,
  parseErrorResponse,
} from '../lib/api'

type Method = 'pearson' | 'spearman' | 'kendall'

interface CorrelationResponse {
  columns: string[]
  matrix: number[][]
  rows_analyzed: number
  title: string
}

const METHOD_HINT: Record<Method, string> = {
  pearson: 'fastest',
  spearman: '2x Pearson',
  kendall: '200x Pearson',
}

function Correlation() {
  const [table, setTable] = useState<TableName>('channels')
  const [method, setMethod] = useState<Method>('pearson')
  const [numericCount, setNumericCount] = useState<number>(0)
  const [data, setData] = useState<CorrelationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchOptions(table)
      .then((all) => {
        if (!cancelled) setNumericCount(numericFields(all).length)
      })
      .catch(() => {
        if (!cancelled) setNumericCount(0)
      })
    setData(null)
    setError(null)
    return () => { cancelled = true }
  }, [table])

  const canCompute = numericCount >= 2

  const handleCompute = async () => {
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const url = `${API_BASE}/stats/correlation/?table=${table}&method=${method}`
      const res = await fetch(url)
      if (!res.ok) {
        setError(await parseErrorResponse(res))
        return
      }
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const plotData = data
    ? [{
        type: 'heatmap' as const,
        z: data.matrix,
        x: data.columns,
        y: data.columns,
        colorscale: 'RdBu',
        zmin: -1,
        zmax: 1,
        texttemplate: '%{z:.3f}',
        textfont: { size: 13 },
        hovertemplate: '%{y} × %{x}<br>r = %{z:.3f}<extra></extra>',
        colorbar: { title: { text: 'r' } },
      }]
    : []

  const plotLayout = {
    title: { text: data?.title ?? '' },
    xaxis: { side: 'bottom' as const },
    yaxis: { autorange: 'reversed' as const },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#dee2e6' },
    margin: { l: 100, r: 20, t: 50, b: 80 },
  }

  return (
    <>
      <h2 className="fs-4 mb-3">Correlation analysis</h2>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-4 align-items-end">
            {/* Table */}
            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold small text-uppercase text-body-secondary">
                Table
              </label>
              <select
                className="form-select"
                value={table}
                onChange={(e) => setTable(e.target.value as TableName)}
              >
                {TABLES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {!canCompute && (
                <div className="form-text text-warning mt-2">
                  Fewer than 2 numeric columns.
                </div>
              )}
            </div>
            
            <div className="col-12 col-md-8">
              <label className="form-label fw-semibold small text-uppercase text-body-secondary d-block">
                Method
              </label>
              <div className="btn-group w-100" role="group" aria-label="method">
                {(['pearson', 'spearman', 'kendall'] as Method[]).map((m) => (
                  <Fragment key={m}>
                    <input
                      type="radio"
                      className="btn-check"
                      name="method"
                      id={`method-${m}`}
                      checked={method === m}
                      onChange={() => setMethod(m)}
                    />
                    <label className="btn btn-outline-primary" htmlFor={`method-${m}`}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </label>
                  </Fragment>
                ))}
              </div>
              <div className="form-text mt-2">
                {METHOD_HINT[method]}
              </div>
            </div>
          </div>
              
          <div className="d-flex justify-content-end mt-4">
            <button
              className="btn btn-primary px-4"
              onClick={handleCompute}
              disabled={loading || !canCompute}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  />
                  Computing…
                </>
              ) : (
                'Compute'
              )}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2">Error: {error}</div>}

      {loading && (
        <div className="text-center py-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
        </div>
      )}

      {data && !loading && (
        <div className="card">
          <div className="card-header small text-uppercase text-body-secondary">
            Result
          </div>
          <div className="card-body">
            <Plot
              data={plotData}
              layout={plotLayout}
              style={{ width: '100%', height: '560px' }}
            />
            <p className="text-body-secondary small mb-0 mt-2">
              Rows analyzed: {data.rows_analyzed.toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </>
  )
}

export default Correlation
