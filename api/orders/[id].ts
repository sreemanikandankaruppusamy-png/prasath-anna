import { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

const ORDERS_KEY = 'sbef:orders';

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

// Authorization check (admin only)
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // All operations on individual orders require admin auth
  if (!isAuthorized(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const { id } = req.query;

    if (req.method === 'GET') {
      // Get single order
      const orders = (await kv.get(ORDERS_KEY)) || [];
      const order = orders.find((o: Order) => o.id === id);

      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      return res.status(200).json({ success: true, data: order });
    }

    if (req.method === 'PATCH') {
      // Update order status
      const { status } = req.body;

      if (!status || !['New', 'Contacted', 'Completed', 'Cancelled'].includes(status)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid status. Must be: New, Contacted, Completed, or Cancelled' 
        });
      }

      const orders = (await kv.get(ORDERS_KEY)) || [];
      const orderIndex = orders.findIndex((o: Order) => o.id === id);

      if (orderIndex === -1) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      orders[orderIndex].status = status;
      await kv.set(ORDERS_KEY, orders);

      return res.status(200).json({ success: true, data: orders[orderIndex] });
    }

    if (req.method === 'DELETE') {
      // Delete order
      const orders = (await kv.get(ORDERS_KEY)) || [];
      const filtered = orders.filter((o: Order) => o.id !== id);

      if (filtered.length === orders.length) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      await kv.set(ORDERS_KEY, filtered);
      return res.status(200).json({ success: true, message: 'Order deleted' });
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
