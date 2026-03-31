export const API_BASE_URL = ''

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
    const msg =
      (isJson && body && typeof body === 'object' && 'detail' in (body as any) && (body as any).detail) ||
      res.statusText ||
      'Request failed'
    throw new ApiError(String(msg), res.status, body)
  }

  return body as T
}

