import { useEffect, useRef, useState } from 'react'
import CrudForm from '../components/CrudForm'
import FilterForm, {
  type FilterClause,
  queryParam,
} from '../components/FilterForm'
import Pagination from '../components/Pagination'
import {
  API_BASE,
  TABLES,
  type FormField,
  type PaginatedResponse,
  type TableName,
  fetchOptions,
  formatCell,
  parseErrorResponse,
} from '../lib/api'

const PAGE_SIZE = 100

function App() {
  const [selected, setSelected] = useState<TableName>('channels')
  const [data, setData] = useState<PaginatedResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)

  const [schema, setSchema] = useState<FormField[]>([])

  // CRUD form state
  const [formOpen, setFormOpen] = useState(false)
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [formBusy, setFormBusy] = useState(false)

  // Filter form state
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterValues, setFilterValues] = useState<Record<string, FilterClause>>({})
  const [filtersDirty, setFiltersDirty] = useState(false)

  const formRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchOptions(selected)
      .then((fields) => { if (!cancelled) setSchema(fields) })
      .catch(() => { if (!cancelled) setSchema([]) })
    return () => { cancelled = true }
  }, [selected])

  const buildUrl = (pageNumber: number, filters = filterValues): string => {
    const params = new URLSearchParams()
    for (const [field, clause] of Object.entries(filters)) {
      const value = clause.value.trim()
      if (!value) continue
      const f = schema.find((s) => s.name === field)
      if (!f) continue
      const param = queryParam(field, clause.op, f.type)
      if (!param) continue
      params.set(param, value)
    }
    if (pageNumber > 1) params.set('page', String(pageNumber))
    const qs = params.toString()
    return `${API_BASE}/${selected}/${qs ? `?${qs}` : ''}`
  }

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

  const handleFetch = () => {
    setFiltersDirty(false)
    return fetchPage(buildUrl(1), 1)
  }

  const handleTableChange = (next: TableName) => {
    setSelected(next)
    setFormValues({})
    setFormError(null)
    setFilterValues({})
    setFiltersDirty(false)
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

  const handleFilterChange = (field: string, clause: FilterClause | null) => {
    setFilterValues((prev) => {
      const next = { ...prev }
      if (clause === null) {
        delete next[field]
      } else {
        next[field] = clause
      }
      return next
    })
    setFiltersDirty(true)
  }

  const handleFilterClear = () => {
    setFilterValues({})
    setFiltersDirty(true)
  }

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0
  const columns =
    data && data.results.length > 0 ? Object.keys(data.results[0]) : []

  return (
    <>
      <div className="d-flex align-items-center gap-2 mb-4">
        <select
          className="form-select w-auto"
          value={selected}
          onChange={(e) => handleTableChange(e.target.value as TableName)}
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

      <FilterForm
        fields={schema}
        values={filterValues}
        onChange={handleFilterChange}
        onClear={handleFilterClear}
        open={filterOpen}
        onToggle={() => setFilterOpen((o) => !o)}
        dirty={filtersDirty}
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
                    <th key={c} className="text-start text-nowrap">
                      {c}
                    </th>
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
    </>
  )
}

export default App
