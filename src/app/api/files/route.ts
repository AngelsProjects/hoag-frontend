import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const nestjsUrl = process.env.NESTJS_API_URL
  if (!nestjsUrl) {
    return NextResponse.json({ error: 'NESTJS_API_URL not configured' }, { status: 500 })
  }

  const path = request.nextUrl.searchParams.get('path')
  const targetUrl = path
    ? `${nestjsUrl}/files?path=${encodeURIComponent(path)}`
    : `${nestjsUrl}/files`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  try {
    const res = await fetch(targetUrl, { signal: controller.signal })
    clearTimeout(timeout)

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message ?? 'Upstream error' },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    clearTimeout(timeout)
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timed out' }, { status: 504 })
    }
    return NextResponse.json({ error: 'NestJS unreachable' }, { status: 502 })
  }
}
