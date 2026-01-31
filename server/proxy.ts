import { Hono } from 'hono'

export const proxy = new Hono().get('/model', async (c) => {
  const url = c.req.query('url')
  if (!url) {
    return c.text('Missing url parameter', 400)
  }

  try {
    const targetUrl = new URL(url)

    // [Security] SSRF Protection
    // 1. Enforce HTTPS
    if (targetUrl.protocol !== 'https:') {
      return c.text('Invalid protocol: https required', 400)
    }

    // 2. Domain Whitelist
    const allowedDomains = ['.meshy.ai'] // Suffix check
    const isAllowed =
      allowedDomains.some((d) => targetUrl.hostname.endsWith(d)) ||
      targetUrl.hostname === 'meshy.ai'

    if (!isAllowed) {
      return c.text('Forbidden: Domain not whitelisted', 403)
    }

    const response = await fetch(url)
    if (!response.ok) {
      return c.text(`Failed to fetch model: ${response.statusText}`, 502)
    }

    const contentType =
      response.headers.get('content-type') || 'application/octet-stream'

    // Set CORS headers explicitly (though Hono might handle if middleware set)
    c.header('Access-Control-Allow-Origin', '*')

    const body = response.body
    if (!body) {
      return c.text('Upstream returned empty body', 502)
    }

    return c.body(body as unknown as ReadableStream, 200, {
      'Content-Type': contentType,
    })
  } catch (error) {
    console.log('Proxy error:', error)
    return c.text('Internal Server Error', 500)
  }
})
