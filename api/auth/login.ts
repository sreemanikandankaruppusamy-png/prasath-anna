import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { username, password } = req.body || {};
    const expectedUser = process.env.ADMIN_USERNAME || 'Admin';
    const expectedPass = process.env.ADMIN_PASSWORD || 'Admin@123';
    const secretToken = process.env.API_SECRET_TOKEN || process.env.API_SECRET_TOKEN_new || 'admin-secret-token';

    if (username === expectedUser && password === expectedPass) {
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token: secretToken
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid username or password'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
