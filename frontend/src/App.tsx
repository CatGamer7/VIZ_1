import { useEffect, useRef, useState } from 'react'
import CrudForm, { type FormField } from './CrudForm'
import Pagination from './Pagination'

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

interface OptionsResponse {
  actions?: {
    POST?: Record<
      string,
      {
        required?: boolean
        type?: string
        label?: string
        max_length?: number
        allow_null?: boolean
      }
    >
  }
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(6)
  }
  return String(value)
}

async function parseErrorResponse(res: Response): Promise<string> {
  try {
    const body = await res.json()
    if (typeof body === 'string') return body
    if (body && typeof body === 'object' && 'detail' in body) {
      return String((body as { detail: unknown }).detail)
    }
    if (body && typeof body === 'object') {
      return Object.entries(body as Record<string, unknown>)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
        .join('\n')
    }
    return `HTTP ${res.status} ${res.statusText}`
  } catch {
    return `HTTP ${res.status} ${res.statusText}`
  }
}

function App() {
  const [selected, setSelected] = useState<TableName>('channels')
  const [data, setData] = useState<PaginatedResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)

  const [schema, setSchema] = useState<FormField[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [formBusy, setFormBusy] = useState(false)

  const formRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/${selected}/`, { method: 'OPTIONS' })
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
        const body = (await res.json()) as OptionsResponse
        const post = body.actions?.POST ?? {}
        const fields: FormField[] = Object.entries(post).map(([name, info]) => ({
          name,
          required: !!info.required,
          type: info.type ?? 'string',
          label: info.label ?? name,
          maxLength: info.max_length,
          allowNull: !!info.allow_null,
        }))
        if (!cancelled) setSchema(fields)
      } catch {
        if (!cancelled) setSchema([])
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [selected])

  const fetchPage = async (url: string, pageNumber: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
      const json: PaginatedResponse = await res.json()
      setData(json)
      setPage(pageNumber)
      setCurrentUrl(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setData(null)
      setCurrentUrl(null)
    } finally {
      setLoading(false)
    }
  }

  const handleFetch = () => fetchPage(`${API_BASE}/${selected}/`, 1)

  const handleTableChange = (next: TableName) => {
    setSelected(next)
    setFormValues({})
    setFormError(null)
    setData(null)
    setCurrentUrl(null)
    setPage(1)
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleClear = () => {
    setFormValues({})
    setFormError(null)
  }

  const handleSave = async () => {
    const id = (formValues.id ?? '').trim()
    if (!id) {
      setFormError('id is required')
      return
    }
    setFormBusy(true)
    setFormError(null)
    try {
      const payload: Record<string, unknown> = {}
      for (const f of schema) {
        const raw = formValues[f.name] ?? ''
        payload[f.name] = raw === '' && f.allowNull ? null : raw
      }
      payload.id = id
      const detailUrl = `${API_BASE}/${selected}/${encodeURIComponent(id)}/`

      let res = await fetch(detailUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.status === 404) {
        res = await fetch(`${API_BASE}/${selected}/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        setFormError(await parseErrorResponse(res))
        return
      }

      if (currentUrl) await fetchPage(currentUrl, page)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e))
    } finally {
      setFormBusy(false)
    }
  }

  const handleDelete = async () => {
    const id = (formValues.id ?? '').trim()
    if (!id) {
      setFormError('id is required')
      return
    }
    if (!window.confirm(`Delete record "${id}" from "${selected}"?`)) return

    setFormBusy(true)
    setFormError(null)
    try {
      const res = await fetch(
        `${API_BASE}/${selected}/${encodeURIComponent(id)}/`,
        { method: 'DELETE' },
      )
      if (!res.ok) {
        setFormError(await parseErrorResponse(res))
        return
      }
      setFormValues({})
      if (currentUrl) await fetchPage(currentUrl, page)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e))
    } finally {
      setFormBusy(false)
    }
  }

  const handleRowClick = (row: Record<string, unknown>) => {
    const next: Record<string, string> = {}
    for (const f of schema) {
      const v = row[f.name]
      next[f.name] = v === null || v === undefined ? '' : String(v)
    }
    setFormValues(next)
    setFormError(null)
    setFormOpen(true)
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0
  const columns =
    data && data.results.length > 0 ? Object.keys(data.results[0]) : []

  return (
    <div className="container py-4" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <h1 className="mb-4 fs-3">Social Media Explorer</h1>

      <div className="d-flex align-items-center gap-2 mb-4">
        <select
          className="form-select w-auto"
          value={selected}
          onChange={(e) => handleTableChange(e.target.value as TableName)}
        >
          {TABLES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={handleFetch} disabled={loading}>
          Fetch
        </button>
        {data && (
          <span className="text-body-secondary ms-auto">
            Total rows: <strong>{data.count.toLocaleString()}</strong>
          </span>
        )}
      </div>

      <CrudForm
        formRef={formRef}
        fields={schema}
        values={formValues}
        onChange={handleFieldChange}
        onSave={handleSave}
        onDelete={handleDelete}
        onClear={handleClear}
        busy={formBusy}
        error={formError}
        open={formOpen}
        onToggle={() => setFormOpen((o) => !o)}
      />

      {loading && <div className="alert alert-secondary py-2">Loading…</div>}
      {error && <div className="alert alert-danger py-2">Error: {error}</div>}

      {data && (
        <>
          <Pagination
            page={page}
            totalPages={totalPages}
            hasPrev={!!data.previous}
            hasNext={!!data.next}
            loading={loading}
            onPrev={() => data.previous && fetchPage(data.previous, page - 1)}
            onNext={() => data.next && fetchPage(data.next, page + 1)}
          />

          <div className="table-responsive">
            <table
              className="table table-bordered table-striped table-hover align-middle mb-0"
              style={{ tableLayout: 'fixed' }}
            >
              <thead className="table-secondary">
                <tr>
                  {columns.map((c) => (
                    <th key={c} className="text-start text-nowrap">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.results.map((row, i) => (
                  <tr
                    key={i}
                    onClick={() => handleRowClick(row)}
                    style={{ cursor: 'pointer' }}
                  >
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

          <Pagination
            page={page}
            totalPages={totalPages}
            hasPrev={!!data.previous}
            hasNext={!!data.next}
            loading={loading}
            onPrev={() => data.previous && fetchPage(data.previous, page - 1)}
            onNext={() => data.next && fetchPage(data.next, page + 1)}
          />
        </>
      )}
    </div>
  )
}

export default App
