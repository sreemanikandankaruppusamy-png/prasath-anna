import { VercelRequest, VercelResponse } from '@vercel/node';
import { isSupabaseActive, dbGetProducts, dbGetOrders } from './lib/db';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const isSupabase = isSupabaseActive();
    const products = await dbGetProducts();
    const orders = await dbGetOrders();

    const dbType = isSupabase 
      ? 'Supabase Cloud Database (PostgreSQL)' 
      : (process.env.KV_REST_API_URL || process.env.KV_URL) 
        ? 'Vercel KV (Redis)' 
        : 'Serverless Cache (Configure Supabase / KV in Vercel)';

    return res.status(200).json({
      success: true,
      database: {
        type: dbType,
        status: isSupabase || process.env.KV_REST_API_URL ? 'Connected 🟢' : 'Fallback Mode 🟡',
        provider: isSupabase ? 'supabase' : 'kv'
      },
      counts: {
        totalProducts: products.length,
        publishedProducts: products.filter(p => p.published).length,
        totalOrders: orders.length,
        newOrders: orders.filter(o => o.status === 'New').length
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
