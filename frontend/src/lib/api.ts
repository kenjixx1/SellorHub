export const API_BASE_URL = 'http://localhost:8000'

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

function buildUrl(path: string) {
  if (API_BASE_URL) return `${API_BASE_URL}${path}`
  return path
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options

  const res = await fetch(buildUrl(path), {
    ...rest,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
  })

  const contentType = res.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')
  const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null)

  if (!res.ok) {
    const msg = formatErrorMessage(isJson, body, res.statusText)
    throw new ApiError(msg, res.status, body)
  }

  return body as T
}

/** Upload a file via multipart/form-data. Browser sets Content-Type + boundary automatically. */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
  token?: string | null,
): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  const contentType = res.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')
  const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null)

  if (!res.ok) {
    const msg = formatErrorMessage(isJson, body, res.statusText)
    throw new ApiError(msg, res.status, body)
  }

  return body as T
}

/** Turn FastAPI `detail` (string | object | array) into a readable message. */
function formatErrorMessage(isJson: boolean, body: unknown, statusText: string): string {
  if (!isJson || !body || typeof body !== 'object') {
    return statusText || 'Request failed'
  }
  const detail = (body as { detail?: unknown }).detail
  if (detail == null) return statusText || 'Request failed'
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const parts = detail.map((item) => {
      if (item && typeof item === 'object' && 'msg' in item) {
        const loc = Array.isArray((item as { loc?: unknown }).loc)
          ? (item as { loc: (string | number)[] }).loc.join('.')
          : ''
        const msg = String((item as { msg: string }).msg)
        return loc ? `${loc}: ${msg}` : msg
      }
      return String(item)
    })
    return parts.join('; ') || statusText || 'Request failed'
  }
  if (typeof detail === 'object') {
    try {
      return JSON.stringify(detail)
    } catch {
      return statusText || 'Request failed'
    }
  }
  return String(detail)
}

