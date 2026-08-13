const BACKEND_API = process.env.NEXT_PUBLIC_API_BASE || 'https://openbazar.onrender.com/api';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const backendUrl = `${BACKEND_API.replace(/\/$/, '')}/auth/phone/send-otp`;
    const headers = { 'Content-Type': 'application/json' };
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body),
    });

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : { message: await response.text() };

    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to connect to backend server' });
  }
}
