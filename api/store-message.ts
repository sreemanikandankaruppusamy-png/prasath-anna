import { VercelRequest, VercelResponse } from '@vercel/node';
import { dbGetAnnouncement, dbSetAnnouncement } from './lib/db';

function isAuthorized(req: VercelRequest): boolean {
  const authHeader = req.headers['authorization'];
  const token = process.env.API_SECRET_TOKEN || process.env.API_SECRET_TOKEN_new || 'admin-secret-token';
  return authHeader === `Bearer ${token}` || authHeader === 'Bearer admin-secret-token';
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const data = await dbGetAnnouncement();
      const message = (data && data.text) ? data.text : (typeof data === 'string' ? data : '');
      return res.status(200).json({
        success: true,
        message: message,
        data: data
      });
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      if (!isAuthorized(req)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const body = req.body || {};
      const message = body.message !== undefined ? body.message : (body.text || '');
      const enabled = body.enabled !== undefined ? body.enabled : true;

      const updated = await dbSetAnnouncement({ text: message, enabled });
      return res.status(200).json({
        success: true,
        message: message,
        data: updated
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
