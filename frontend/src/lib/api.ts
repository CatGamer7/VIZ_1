export const API_BASE = '/api/v1'

export type TableName =
  | 'channels'
  | 'events'
  | 'messages'
  | 'sources'
  | 'channel-connections'

export const TABLES: TableName[] = [
  'channels',
  'events',
  'messages',
  'sources',
  'channel-connections',
]

export interface FormField {
  name: string
  required: boolean
  type: string
  label: string
  maxLength?: number
  allowNull: boolean
}

export interface PaginatedResponse {
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

export function formatCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(6)
  }
  return String(value)
}

export async function parseErrorResponse(res: Response): Promise<string> {
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

export async function fetchOptions(table: TableName): Promise<FormField[]> {
  const res = await fetch(`${API_BASE}/${table}/`, { method: 'OPTIONS' })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  const body = (await res.json()) as OptionsResponse
  const post = body.actions?.POST ?? {}
  return Object.entries(post).map(([name, info]) => ({
    name,
    required: !!info.required,
    type: info.type ?? 'string',
    label: info.label ?? name,
    maxLength: info.max_length,
    allowNull: !!info.allow_null,
  }))
}

export function numericFields(fields: FormField[]): FormField[] {
  return fields.filter(
    (f) =>
      f.name !== 'id' &&
      (f.type === 'float' || f.type === 'integer' || f.type === 'decimal'),
  )
}
