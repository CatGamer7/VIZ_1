import type { RefObject } from 'react'

export interface FormField {
  name: string
  required: boolean
  type: string
  label: string
  maxLength?: number
  allowNull: boolean
}

interface CrudFormProps {
  fields: FormField[]
  values: Record<string, string>
  onChange: (field: string, value: string) => void
  onSave: () => void
  onDelete: () => void
  onClear: () => void
  busy: boolean
  error: string | null
  open: boolean
  onToggle: () => void
  formRef: RefObject<HTMLDivElement | null>
}

export default function CrudForm({
  fields,
  values,
  onChange,
  onSave,
  onDelete,
  onClear,
  busy,
  error,
  open,
  onToggle,
  formRef,
}: CrudFormProps) {
  return (
    <div ref={formRef} className="card mb-3">
      <div
        className="card-header d-flex align-items-center user-select-none"
        style={{ cursor: 'pointer' }}
        onClick={onToggle}
      >
        <span className="me-2">{open ? '▾' : '▸'}</span>
        <strong>Create / Edit record</strong>
      </div>

      {open && (
        <div className="card-body">
          {error && (
            <div
              className="alert alert-danger py-2"
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {error}
            </div>
          )}

          <div className="row g-2">
            {fields.map((f) => (
              <div className="col-12 col-md-6 col-lg-4" key={f.name}>
                <label className="form-label mb-1">
                  {f.label}
                  {f.required && <span className="text-danger ms-1">*</span>}
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={values[f.name] ?? ''}
                  onChange={(e) => onChange(f.name, e.target.value)}
                  disabled={busy}
                />
              </div>
            ))}
          </div>

          <div className="d-flex gap-2 mt-3">
            <button
              className="btn btn-primary"
              onClick={onSave}
              disabled={busy}
            >
              {busy ? 'Working…' : 'Create / Update'}
            </button>
            <button
              className="btn btn-outline-danger"
              onClick={onDelete}
              disabled={busy}
            >
              Delete
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={onClear}
              disabled={busy}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
