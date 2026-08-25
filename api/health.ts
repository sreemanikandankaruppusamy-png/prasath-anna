import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ 
    success: true, 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
}
