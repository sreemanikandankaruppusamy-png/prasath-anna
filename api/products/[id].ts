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
  const token = process.env.API_SECRET_TOKEN || process.env.API_SECRET_TOKEN_new || 'admin-secret-token';
  return authHeader === `Bearer ${token}` || authHeader === 'Bearer admin-secret-token';
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { id } = req.query;

    if (req.method === 'GET') {
      // Get single product
      const products = (await kv.get(PRODUCTS_KEY)) || [];
      const product = products.find((p: Product) => p.id === id);
      
      if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }

      return res.status(200).json({ success: true, data: product });
    }

    if (req.method === 'PUT') {
      // Update product (admin only)
      if (!isAuthorized(req)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const products = (await kv.get(PRODUCTS_KEY)) || [];
      const productIndex = products.findIndex((p: Product) => p.id === id);

      if (productIndex === -1) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }

      const { name, brand, category, price, discount, description, image, colors, published } = req.body;
      
      const updated: Product = {
        ...products[productIndex],
        name: name !== undefined ? name.trim() : products[productIndex].name,
        brand: brand !== undefined ? brand.trim() : products[productIndex].brand,
        category: category !== undefined ? category : products[productIndex].category,
        price: price !== undefined ? parseFloat(price) : products[productIndex].price,
        discount: discount !== undefined ? parseFloat(discount) : products[productIndex].discount,
        description: description !== undefined ? description.trim() : products[productIndex].description,
        image: image !== undefined ? image : products[productIndex].image,
        colors: colors !== undefined ? colors : products[productIndex].colors,
        published: published !== undefined ? published : products[productIndex].published,
        updatedAt: new Date().toISOString(),
      };

      products[productIndex] = updated;
      await kv.set(PRODUCTS_KEY, products);

      return res.status(200).json({ success: true, data: updated });
    }

    if (req.method === 'PATCH') {
      // Toggle publish status (admin only)
      if (!isAuthorized(req)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const products = (await kv.get(PRODUCTS_KEY)) || [];
      const productIndex = products.findIndex((p: Product) => p.id === id);

      if (productIndex === -1) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }

      const updated: Product = {
        ...products[productIndex],
        published: !products[productIndex].published,
        updatedAt: new Date().toISOString(),
      };

      products[productIndex] = updated;
      await kv.set(PRODUCTS_KEY, products);

      return res.status(200).json({ success: true, data: updated });
    }

    if (req.method === 'DELETE') {
      // Delete product (admin only)
      if (!isAuthorized(req)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const products = (await kv.get(PRODUCTS_KEY)) || [];
      const filtered = products.filter((p: Product) => p.id !== id);

      if (filtered.length === products.length) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }

      await kv.set(PRODUCTS_KEY, filtered);
      return res.status(200).json({ success: true, message: 'Product deleted' });
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
