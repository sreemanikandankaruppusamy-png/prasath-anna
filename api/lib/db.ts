import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { kv } from '@vercel/kv';

// Resolve Supabase credentials supporting standard and Vercel-prefixed env names
const SUPABASE_URL = 
  process.env.SUPABASE_URL || 
  process.env.html_HTMLSUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  '';

const SUPABASE_KEY = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  process.env.html_HTMLSUPABASE_ANON_KEY || 
  process.env.html_HTMLSUPABASE_PUBLISHABLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  '';

let supabaseClient: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('⚡ Connected to Supabase Cloud Database');
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
  }
}

export function isSupabaseActive(): boolean {
  return supabaseClient !== null;
}

export function getSupabase(): SupabaseClient | null {
  return supabaseClient;
}

const PRODUCTS_KEY = 'sbef:products';
const ORDERS_KEY = 'sbef:orders';

// In-memory cache for serverless execution fallback
let memoryProducts: any[] = [];
let memoryOrders: any[] = [];

// ==================== PRODUCTS ====================

export async function dbGetProducts(): Promise<any[]> {
  // 1. Try Supabase
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        // Map database column names if needed
        return data.map(p => ({
          id: p.id,
          name: p.name,
          brand: p.brand || '',
          category: p.category,
          price: parseFloat(p.price) || 0,
          discount: parseFloat(p.discount) || 0,
          description: p.description || '',
          image: p.image || null,
          published: Boolean(p.published),
          colors: Array.isArray(p.colors) ? p.colors : [],
          createdAt: p.created_at || p.createdAt,
          updatedAt: p.updated_at || p.updatedAt
        }));
      }
      console.warn('Supabase products fetch warning:', error?.message);
    } catch (err) {
      console.warn('Supabase query error:', err);
    }
  }

  // 2. Try Vercel KV
  if (process.env.KV_REST_API_URL || process.env.KV_URL) {
    try {
      const products = await kv.get(PRODUCTS_KEY);
      if (Array.isArray(products)) return products;
    } catch (err) {
      console.warn('Vercel KV products fetch warning:', err);
    }
  }

  // 3. Fallback memory
  return memoryProducts;
}

export async function dbSaveProduct(product: any): Promise<any> {
  // 1. Try Supabase
  if (supabaseClient) {
    try {
      const dbRow = {
        id: product.id,
        name: product.name,
        brand: product.brand || '',
        category: product.category,
        price: product.price,
        discount: product.discount || 0,
        description: product.description || '',
        image: product.image || null,
        published: Boolean(product.published),
        colors: product.colors || [],
        created_at: product.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseClient
        .from('products')
        .upsert(dbRow)
        .select()
        .single();

      if (!error && data) return product;
      console.warn('Supabase product save warning:', error?.message);
    } catch (err) {
      console.warn('Supabase product save error:', err);
    }
  }

  // 2. Try Vercel KV
  if (process.env.KV_REST_API_URL || process.env.KV_URL) {
    try {
      const products = ((await kv.get(PRODUCTS_KEY)) as any[]) || [];
      const index = products.findIndex((p: any) => p.id === product.id);
      if (index >= 0) {
        products[index] = product;
      } else {
        products.unshift(product);
      }
      await kv.set(PRODUCTS_KEY, products);
      return product;
    } catch (err) {
      console.warn('Vercel KV save error:', err);
    }
  }

  // 3. Fallback memory
  const idx = memoryProducts.findIndex(p => p.id === product.id);
  if (idx >= 0) memoryProducts[idx] = product;
  else memoryProducts.unshift(product);
  return product;
}

export async function dbDeleteProduct(id: string): Promise<boolean> {
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient.from('products').delete().eq('id', id);
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase delete error:', err);
    }
  }

  if (process.env.KV_REST_API_URL || process.env.KV_URL) {
    try {
      const products = ((await kv.get(PRODUCTS_KEY)) as any[]) || [];
      const filtered = products.filter(p => p.id !== id);
      await kv.set(PRODUCTS_KEY, filtered);
      return true;
    } catch (err) {
      console.warn('Vercel KV delete error:', err);
    }
  }

  memoryProducts = memoryProducts.filter(p => p.id !== id);
  return true;
}

// ==================== ORDERS ====================

export async function dbGetOrders(): Promise<any[]> {
  // 1. Try Supabase
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map(o => ({
          id: o.id,
          type: o.type || 'order',
          createdAt: o.created_at || o.createdAt,
          customerName: o.customer_name || o.customerName || '',
          phone: o.phone || '',
          message: o.message || undefined,
          address: o.address || undefined,
          notes: o.notes || undefined,
          items: Array.isArray(o.items) ? o.items : [],
          total: parseFloat(o.total) || 0,
          status: o.status || 'New'
        }));
      }
      console.warn('Supabase orders fetch warning:', error?.message);
    } catch (err) {
      console.warn('Supabase orders query error:', err);
    }
  }

  // 2. Try Vercel KV
  if (process.env.KV_REST_API_URL || process.env.KV_URL) {
    try {
      const orders = await kv.get(ORDERS_KEY);
      if (Array.isArray(orders)) return orders;
    } catch (err) {
      console.warn('Vercel KV orders fetch warning:', err);
    }
  }

  // 3. Fallback memory
  return memoryOrders;
}

export async function dbSaveOrder(order: any): Promise<any> {
  // 1. Try Supabase
  if (supabaseClient) {
    try {
      const dbRow = {
        id: order.id,
        type: order.type || 'order',
        customer_name: order.customerName,
        phone: order.phone,
        message: order.message || null,
        address: order.address || null,
        notes: order.notes || null,
        items: order.items || [],
        total: order.total || 0,
        status: order.status || 'New',
        created_at: order.createdAt || new Date().toISOString()
      };

      const { data, error } = await supabaseClient
        .from('orders')
        .insert([dbRow])
        .select()
        .single();

      if (!error && data) return order;
      console.warn('Supabase order insert warning:', error?.message);
    } catch (err) {
      console.warn('Supabase order insert error:', err);
    }
  }

  // 2. Try Vercel KV
  if (process.env.KV_REST_API_URL || process.env.KV_URL) {
    try {
      const orders = ((await kv.get(ORDERS_KEY)) as any[]) || [];
      orders.unshift(order);
      await kv.set(ORDERS_KEY, orders);
      return order;
    } catch (err) {
      console.warn('Vercel KV save order error:', err);
    }
  }

  // 3. Fallback memory
  memoryOrders.unshift(order);
  return order;
}

export async function dbUpdateOrderStatus(id: string, status: string): Promise<any> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase update order status error:', err);
    }
  }

  if (process.env.KV_REST_API_URL || process.env.KV_URL) {
    try {
      const orders = ((await kv.get(ORDERS_KEY)) as any[]) || [];
      const order = orders.find((o: any) => o.id === id);
      if (order) {
        order.status = status;
        await kv.set(ORDERS_KEY, orders);
        return order;
      }
    } catch (err) {
      console.warn('Vercel KV update order error:', err);
    }
  }

  const o = memoryOrders.find(x => x.id === id);
  if (o) o.status = status;
  return o;
}

export async function dbDeleteOrder(id: string): Promise<boolean> {
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient.from('orders').delete().eq('id', id);
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase delete order error:', err);
    }
  }

  if (process.env.KV_REST_API_URL || process.env.KV_URL) {
    try {
      const orders = ((await kv.get(ORDERS_KEY)) as any[]) || [];
      const filtered = orders.filter((o: any) => o.id !== id);
      await kv.set(ORDERS_KEY, filtered);
      return true;
    } catch (err) {
      console.warn('Vercel KV delete order error:', err);
    }
  }

  memoryOrders = memoryOrders.filter(x => x.id !== id);
  return true;
}

// ==================== ANNOUNCEMENTS / STORE MESSAGES ====================
const ANNOUNCEMENT_KEY = 'sbef:announcement';
let memoryAnnouncement = {
  text: 'Special Offer: Free delivery & installation in Erode on all orders above ₹10,000!',
  enabled: true,
  updatedAt: new Date().toISOString()
};

export async function dbGetAnnouncement(): Promise<any> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('settings')
        .select('*')
        .eq('key', 'announcement')
        .single();
      if (!error && data && data.value) {
        return data.value;
      }
    } catch (e) {
      console.warn('Supabase get announcement error:', e);
    }
  }

  if (process.env.KV_REST_API_URL || process.env.KV_URL) {
    try {
      const val = await kv.get(ANNOUNCEMENT_KEY);
      if (val) return val;
    } catch (e) {
      console.warn('Vercel KV get announcement error:', e);
    }
  }

  return memoryAnnouncement;
}

export async function dbSetAnnouncement(announcement: any): Promise<any> {
  const payload = {
    text: announcement.text || '',
    enabled: announcement.enabled !== false,
    updatedAt: new Date().toISOString()
  };

  if (supabaseClient) {
    try {
      await supabaseClient
        .from('settings')
        .upsert({
          key: 'announcement',
          value: payload,
          updated_at: payload.updatedAt
        });
    } catch (e) {
      console.warn('Supabase set announcement error:', e);
    }
  }

  if (process.env.KV_REST_API_URL || process.env.KV_URL) {
    try {
      await kv.set(ANNOUNCEMENT_KEY, payload);
    } catch (e) {
      console.warn('Vercel KV set announcement error:', e);
    }
  }

  memoryAnnouncement = payload;
  return payload;
}

