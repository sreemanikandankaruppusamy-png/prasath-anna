import { VercelRequest, VercelResponse } from '@vercel/node';
import { dbGetOrders, dbSaveOrder } from '../lib/db';

interface Order {
  id: string;
  type: 'order' | 'query';
  createdAt: string;
  customerName: string;
  phone: string;
  message?: string;
  address?: string;
  notes?: string;
  items: Array<{ name: string; qty: number; price: number; color?: string }>;
  total: number;
  status: 'New' | 'Contacted' | 'Completed' | 'Cancelled';
}

// Authorization check
function isAuthorized(req: VercelRequest): boolean {
  const authHeader = req.headers['authorization'];
  const token = process.env.API_SECRET_TOKEN || process.env.API_SECRET_TOKEN_new || 'admin-secret-token';
  return authHeader === `Bearer ${token}` || authHeader === 'Bearer admin-secret-token';
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Get all orders (admin only)
      if (!isAuthorized(req)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const orders = await dbGetOrders();
      return res.status(200).json({ success: true, data: orders });
    }

    if (req.method === 'POST') {
      // Create new order/query (customer can submit without auth)
      const { type, customerName, phone, message, address, notes, items, total } = req.body;

      if (!type || !customerName || !phone || !['order', 'query'].includes(type)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: type, customerName, phone' 
        });
      }

      if (type === 'order' && (!items || items.length === 0)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Order must contain items' 
        });
      }

      const newOrder: Order = {
        id: `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type,
        createdAt: new Date().toISOString(),
        customerName: customerName.trim(),
        phone: phone.trim(),
        message: message?.trim() || undefined,
        address: address?.trim() || undefined,
        notes: notes?.trim() || undefined,
        items: items || [],
        total: parseFloat(total) || 0,
        status: 'New',
      };

      await dbSaveOrder(newOrder);
      return res.status(201).json({ success: true, data: newOrder });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error?.message || 'Internal server error' 
    });
  }
}
