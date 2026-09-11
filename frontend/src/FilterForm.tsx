import type { FormField } from './CrudForm'

export interface FilterClause {
  op: string
  value: string
}

interface FilterFormProps {
  fields: FormField[]
  values: Record<string, FilterClause>
  onChange: (field: string, clause: FilterClause | null) => void
  onClear: () => void
  open: boolean
  onToggle: () => void
  dirty: boolean
}

export function opsForType(type: string): string[] {
  if (type === 'float' || type === 'integer' || type === 'decimal') {
    return ['=', '≠', '>', '≥', '<', '≤']
  }
  return ['=']
}

export function queryParam(
  field: string,
  op: string,
  type: string,
): string | null {
  const numeric =
    type === 'float' || type === 'integer' || type === 'decimal'

  if (numeric) {
    switch (op) {
      case '=': return field
      case '≠': return `${field}__ne`
      case '>': return `${field}__gt`
      case '≥': return `${field}__gte`
      case '<': return `${field}__lt`
      case '≤': return `${field}__lte`
    }
    return null
  }

  if (type === 'field') {
    return op === '=' ? field : null
  }

  return op === '=' ? `${field}__icontains` : null
}

export default function FilterForm({
  fields,
  values,
  onChange,
  onClear,
  open,
  onToggle,
  dirty,
}: FilterFormProps) {
  const activeCount = Object.values(values).filter(
    (c) => c.value.trim() !== '',
  ).length

  return (
    <div className="card mb-3">
      <div
        className="card-header d-flex align-items-center user-select-none"
        style={{ cursor: 'pointer' }}
        onClick={onToggle}
      >
        <span className="me-2">{open ? '▾' : '▸'}</span>
        <strong>Filters</strong>
        {activeCount > 0 && (
          <span className="badge bg-primary ms-2">{activeCount}</span>
        )}
        {dirty && activeCount > 0 && (
          <span className="badge bg-warning text-dark ms-2">
            not applied — click Fetch
          </span>
        )}
        <span className="text-body-secondary ms-auto small">
          Applied on Fetch
        </span>
      </div>

      {open && (
        <div className="card-body">
          <div className="row g-2">
            {fields.map((f) => {
              const clause = values[f.name]
              const ops = opsForType(f.type)
              const currentOp = clause?.op ?? ops[0]
              const currentValue = clause?.value ?? ''

              return (
                <div className="col-12 col-md-6 col-lg-4" key={f.name}>
                  <label className="form-label mb-1">{f.label}</label>
                  <div className="input-group">
                    <select
                      className="form-select"
                      style={{ maxWidth: '5rem' }}
                      value={currentOp}
                      disabled={ops.length === 1}
                      onChange={(e) =>
                        onChange(f.name, {
                          op: e.target.value,
                          value: currentValue,
                        })
                      }
                    >
                      {ops.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      className="form-control"
                      value={currentValue}
                      placeholder="filter value"
                      onChange={(e) =>
                        onChange(f.name, {
                          op: currentOp,
                          value: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="d-flex align-items-center gap-2 mt-3">
            <button
              className="btn btn-outline-secondary"
              onClick={onClear}
              disabled={activeCount === 0}
            >
              Clear all
            </button>
            <span className="text-body-secondary small">
              {activeCount === 0
                ? 'No active filters'
                : `${activeCount} filter${activeCount === 1 ? '' : 's'} active`}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
