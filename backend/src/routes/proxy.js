import { Router } from 'express';

const router = Router();

const CODEMAO_API_BASE = 'https://api.codemao.cn';

router.get(/^\/studio\/(.*)$/, async (req, res) => {
  try {
    const path = req.params[0] || '';
    const targetUrl = `${CODEMAO_API_BASE}/web/${path}`;
    const params = new URLSearchParams(req.query);
    const url = `${targetUrl}?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch data', status: response.status });
    }

    const data = await response.json();
    res.set('Cache-Control', 'public, max-age=300');
    res.json(data);
  } catch (error) {
    res.status(502).json({ error: 'Proxy error', message: error.message });
  }
});

export default router;
