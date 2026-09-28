import { Fragment, useEffect, useState } from 'react'
import Plot from '../lib/Plot'
import {
  API_BASE,
  TABLES,
  type FormField,
  type TableName,
  fetchOptions,
  numericFields,
  parseErrorResponse,
} from '../lib/api'

type PlotType = 'histogram' | 'qq'

interface HistogramResponse {
  centers: number[]
  counts: number[]
  widths: number[]
  rows_analyzed: number
  x_label: string
  y_label: string
  title: string
}

interface QQResponse {
  theoretical: number[]
  sample: number[]
  ref_slope: number
  ref_intercept: number
  rows_analyzed: number
  x_label: string
  y_label: string
  title: string
}

function Normality() {
  const [table, setTable] = useState<TableName>('channels')
  const [fields, setFields] = useState<FormField[]>([])
  const [column, setColumn] = useState<string>('')
  const [plotType, setPlotType] = useState<PlotType>('histogram')

  const [histogram, setHistogram] = useState<HistogramResponse | null>(null)
  const [qq, setQQ] = useState<QQResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchOptions(table)
      .then((all) => {
        if (cancelled) return
        const numeric = numericFields(all)
        setFields(numeric)
        setColumn(numeric[0]?.name ?? '')
        setHistogram(null)
        setQQ(null)
        setError(null)
      })
      .catch(() => {
        if (!cancelled) setFields([])
      })
    return () => { cancelled = true }
  }, [table])

  const handleCompute = async () => {
    if (!column) return
    setLoading(true)
    setError(null)
    setHistogram(null)
    setQQ(null)
    try {
      const endpoint = plotType === 'histogram' ? 'histogram' : 'qq'
      const url = `${API_BASE}/stats/${endpoint}/?table=${table}&column=${column}`
      const res = await fetch(url)
      if (!res.ok) {
        setError(await parseErrorResponse(res))
        return
      }
      const body = await res.json()
      if (plotType === 'histogram') setHistogram(body)
      else setQQ(body)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const plotData = histogram
    ? [{
        type: 'bar' as const,
        x: histogram.centers,
        y: histogram.counts,
        width: histogram.widths,
        marker: { color: '#0d6efd' },
        hovertemplate: 'x = %{x:.4f}<br>count = %{y}<extra></extra>',
      }]
    : qq
    ? [
        {
          type: 'scatter' as const,
          mode: 'markers' as const,
          x: qq.theoretical,
          y: qq.sample,
          marker: { color: '#0d6efd', size: 4 },
          name: 'Sample',
        },
        {
          type: 'scatter' as const,
          mode: 'lines' as const,
          x: qq.theoretical,
          y: qq.theoretical.map(
            (t) => qq.ref_slope * t + qq.ref_intercept,
          ),
          line: { color: '#dc3545', width: 2 },
          name: 'Reference (normal)',
        },
      ]
    : []

  const plotLayout = {
    title: { text: histogram?.title ?? qq?.title ?? '' },
    xaxis: { title: { text: histogram?.x_label ?? qq?.x_label ?? '' } },
    yaxis: { title: { text: histogram?.y_label ?? qq?.y_label ?? '' } },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#dee2e6' },
    margin: { l: 60, r: 20, t: 50, b: 50 },
  }

  const rowsAnalyzed = histogram?.rows_analyzed ?? qq?.rows_analyzed

  return (
    <>
      <h2 className="fs-4 mb-3">Normality test</h2>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-4 align-items-end">
            {/* Table */}
            <div className="col-12 col-md-6 col-lg-4">
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
            </div>
              
            {/* Column (segmented) */}
            <div className="col-12 col-md-6 col-lg-4">
              <label className="form-label fw-semibold small text-uppercase text-body-secondary d-block">
                Column
              </label>
              {fields.length === 0 ? (
                <span className="text-body-secondary small fst-italic">
                  No numeric columns
                </span>
              ) : (
                <div className="btn-group w-100" role="group" aria-label="column">
                  {fields.map((f) => (
                    <Fragment key={f.name}>
                      <input
                        type="radio"
                        className="btn-check"
                        name="column"
                        id={`col-${f.name}`}
                        checked={column === f.name}
                        onChange={() => setColumn(f.name)}
                      />
                      <label
                        className="btn btn-outline-primary"
                        htmlFor={`col-${f.name}`}
                      >
                        {f.label}
                      </label>
                    </Fragment>
                  ))}
                </div>
              )}
            </div>
            
            {/* Plot type (segmented) */}
            <div className="col-12 col-md-6 col-lg-4">
              <label className="form-label fw-semibold small text-uppercase text-body-secondary d-block">
                Plot type
              </label>
              <div className="btn-group w-100" role="group" aria-label="plot type">
                <input
                  type="radio"
                  className="btn-check"
                  name="plotType"
                  id="plot-hist"
                  checked={plotType === 'histogram'}
                  onChange={() => setPlotType('histogram')}
                />
                <label className="btn btn-outline-primary" htmlFor="plot-hist">
                  Histogram
                </label>
            
                <input
                  type="radio"
                  className="btn-check"
                  name="plotType"
                  id="plot-qq"
                  checked={plotType === 'qq'}
                  onChange={() => setPlotType('qq')}
                />
                <label className="btn btn-outline-primary" htmlFor="plot-qq">
                  Q-Q plot
                </label>
              </div>
            </div>
          </div>
            
          <div className="d-flex justify-content-end mt-4">
            <button
              className="btn btn-primary px-4"
              onClick={handleCompute}
              disabled={loading || !column}
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

      {(histogram || qq) && !loading && (
        <div className="card">
          <div className="card-header small text-uppercase text-body-secondary">
            Result
          </div>
          <div className="card-body">
            <Plot
              data={plotData}
              layout={plotLayout}
              style={{ width: '100%', height: '520px' }}
            />
            <p className="text-body-secondary small mb-0 mt-2">
              Rows analyzed: {rowsAnalyzed?.toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </>
  )
}

export default Normality
