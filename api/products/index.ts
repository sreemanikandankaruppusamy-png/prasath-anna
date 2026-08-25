import { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

const PRODUCTS_KEY = 'sbef:products';

interface Product {
  id: string;
  name: string;
  brand?: string;
  category: string;
  price: number;
  discount: number;
  description: string;
  image?: string | null;
  published: boolean;
  colors?: Array<{ id: string; name: string; hex: string }>;
  createdAt: string;
  updatedAt: string;
}

// Authorization check
function isAuthorized(req: VercelRequest): boolean {
  const authHeader = req.headers['authorization'];
  const token = process.env.API_SECRET_TOKEN;
  return authHeader === `Bearer ${token}`;
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
      // Get all products (public read)
      const products = (await kv.get(PRODUCTS_KEY)) || [];
      return res.status(200).json({ success: true, data: products });
    }

    if (req.method === 'POST') {
      // Create new product (admin only)
      if (!isAuthorized(req)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { name, brand, category, price, discount, description, image, colors } = req.body;

      if (!name || !category || price === undefined) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: name, category, price' 
        });
      }

      const newProduct: Product = {
        id: `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: name.trim(),
        brand: brand?.trim() || '',
        category,
        price: parseFloat(price),
        discount: parseFloat(discount) || 0,
        description: description?.trim() || '',
        image: image || null,
        published: false,
        colors: colors || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const products = (await kv.get(PRODUCTS_KEY)) || [];
      products.push(newProduct);
      await kv.set(PRODUCTS_KEY, products);

      return res.status(201).json({ success: true, data: newProduct });
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
