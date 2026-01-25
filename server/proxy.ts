import { Hono } from 'hono'

export const proxy = new Hono().get('/model', async (c) => {
	const url = c.req.query('url')
	if (!url) {
		return c.text('Missing url parameter', 400)
	}

	try {
		const response = await fetch(url)
		if (!response.ok) {
			return c.text(`Failed to fetch model: ${response.statusText}`, 502)
		}

		const contentType = response.headers.get('content-type') || 'application/octet-stream'

		// Set CORS headers explicitly (though Hono might handle if middleware set)
		c.header('Access-Control-Allow-Origin', '*')

		return c.body(response.body, 200, {
			'Content-Type': contentType,
		})
	} catch (error) {
		console.error('Proxy error:', error)
		return c.text('Internal Server Error', 500)
	}
})
