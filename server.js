const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });
require('dotenv').config(); // fallback to .env

const app = express();
const PORT = process.env.PORT || 3000;
const API_SECRET_TOKEN = process.env.API_SECRET_TOKEN || 'admin-secret-token';
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial realistic seed products for Sri Balu Electronics & Furnitures
const INITIAL_PRODUCTS = [
  {
    id: 'id_demo_tv_01',
    name: 'Samsung 43" Crystal 4K Smart TV',
    brand: 'Samsung',
    category: 'electronics',
    price: 28990,
    discount: 15,
    description: 'Ultra HD 4K LED Smart TV with HDR10+, Dolby Audio, voice remote and built-in streaming apps.',
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&auto=format&fit=crop&q=80',
    published: true,
    colors: [{ id: 'c1', name: 'Gloss Black', hex: '#1B2A4A' }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'id_demo_table_02',
    name: 'Solid Sheesham Wood 6-Seater Dining Table',
    brand: 'WoodCraft',
    category: 'furniture',
    price: 21500,
    discount: 10,
    description: 'Handcrafted premium Sheesham wood dining table set with 6 comfortable cushioned chairs in walnut finish.',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&auto=format&fit=crop&q=80',
    published: true,
    colors: [
      { id: 'c2', name: 'Walnut Dark', hex: '#6B4226' },
      { id: 'c3', name: 'Natural Honey', hex: '#C9A86A' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'id_demo_speaker_03',
    name: 'JBL Charge 5 Portable Bluetooth Speaker',
    brand: 'JBL',
    category: 'electronics',
    price: 14999,
    discount: 12,
    description: 'Waterproof IP67 portable speaker with 20 hours playtime, powerbank feature, and signature deep bass.',
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80',
    published: true,
    colors: [
      { id: 'c4', name: 'Fiery Red', hex: '#B54747' },
      { id: 'c5', name: 'Midnight Black', hex: '#1B2A4A' },
      { id: 'c6', name: 'Ocean Blue', hex: '#3B5BA5' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'id_demo_sofa_04',
    name: 'Luxury 3-Seater Fabric Recliner Sofa',
    brand: 'Urban Living',
    category: 'furniture',
    price: 34999,
    discount: 8,
    description: 'Ergonomic high-density foam recliner sofa with breathable velvet fabric and sturdy hardwood frame.',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
    published: true,
    colors: [
      { id: 'c7', name: 'Slate Grey', hex: '#4A5568' },
      { id: 'c8', name: 'Warm Cream', hex: '#E2D9C9' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'id_demo_purifier_05',
    name: 'Kaviya 10-Stage RO+UV+Alkaline Water Purifier',
    brand: 'Kaviya',
    category: 'rowater',
    price: 11499,
    discount: 18,
    description: 'Advanced 10-stage RO+UV+UF+TDS control with 10L food-grade storage and active copper alkaline boost.',
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&auto=format&fit=crop&q=80',
    published: true,
    colors: [
      { id: 'c9', name: 'Arctic White', hex: '#FFFFFF' },
      { id: 'c10', name: 'Piano Black', hex: '#1B2A4A' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Initial demo order
const INITIAL_ORDERS = [
  {
    id: 'ord_demo_101',
    type: 'order',
    customerName: 'Karthik Raja',
    phone: '+91 98765 43210',
    address: '14/B Gandhi Road, Erode, Tamil Nadu - 638001',
    notes: 'Please call before delivery in the afternoon.',
    items: [
      { name: 'Samsung 43" Crystal 4K Smart TV', qty: 1, price: 24641.5, color: 'Gloss Black' }
    ],
    total: 24641.5,
    status: 'New',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'qry_demo_102',
    type: 'query',
    customerName: 'Priya Sundaram',
    phone: '+91 94433 12345',
    message: 'Do you provide free installation for the RO Water purifier in Perundurai area?',
    items: [],
    total: 0,
    status: 'Contacted',
    createdAt: new Date(Date.now() - 7200000).toISOString()
  }
];

// ==================== DATABASE ADAPTER ====================
class LocalDatabase {
  constructor(filePath) {
    this.filePath = filePath;
    this.init();
  }

  init() {
    if (!fs.existsSync(this.filePath)) {
      this.write({
        products: INITIAL_PRODUCTS,
        orders: INITIAL_ORDERS,
        meta: { createdAt: new Date().toISOString(), version: '1.0' }
      });
      console.log('📦 Initialized local database with sample store products and orders.');
    } else {
      try {
        const data = this.read();
        let changed = false;
        if (!Array.isArray(data.products) || data.products.length === 0) {
          data.products = INITIAL_PRODUCTS;
          changed = true;
        }
        if (!Array.isArray(data.orders)) {
          data.orders = INITIAL_ORDERS;
          changed = true;
        }
        if (changed) this.write(data);
      } catch (err) {
        console.error('Error reading existing DB file, reinitializing:', err);
        this.write({ products: INITIAL_PRODUCTS, orders: INITIAL_ORDERS });
      }
    }
  }

  read() {
    try {
      const content = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(content);
    } catch (err) {
      return { products: [], orders: [] };
    }
  }

  write(data) {
    const tmpFile = `${this.filePath}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpFile, this.filePath);
  }

  getProducts() {
    return this.read().products || [];
  }

  saveProduct(prod) {
    const data = this.read();
    data.products = data.products || [];
    data.products.push(prod);
    this.write(data);
    return prod;
  }

  updateProduct(id, updates) {
    const data = this.read();
    const idx = (data.products || []).findIndex(p => p.id === id);
    if (idx === -1) return null;
    data.products[idx] = {
      ...data.products[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.write(data);
    return data.products[idx];
  }

  togglePublishProduct(id) {
    const data = this.read();
    const p = (data.products || []).find(x => x.id === id);
    if (!p) return null;
    p.published = !p.published;
    p.updatedAt = new Date().toISOString();
    this.write(data);
    return p;
  }

  deleteProduct(id) {
    const data = this.read();
    const initialLen = (data.products || []).length;
    data.products = (data.products || []).filter(p => p.id !== id);
    this.write(data);
    return data.products.length < initialLen;
  }

  getOrders() {
    return this.read().orders || [];
  }

  createOrder(order) {
    const data = this.read();
    data.orders = data.orders || [];
    data.orders.unshift(order); // newest first
    this.write(data);
    return order;
  }

  updateOrderStatus(id, status) {
    const data = this.read();
    const o = (data.orders || []).find(x => x.id === id);
    if (!o) return null;
    o.status = status;
    o.updatedAt = new Date().toISOString();
    this.write(data);
    return o;
  }

  deleteOrder(id) {
    const data = this.read();
    const initialLen = (data.orders || []).length;
    data.orders = (data.orders || []).filter(o => o.id !== id);
    this.write(data);
    return data.orders.length < initialLen;
  }

  resetDemo() {
    this.write({
      products: INITIAL_PRODUCTS,
      orders: INITIAL_ORDERS,
      meta: { resetAt: new Date().toISOString() }
    });
    return { products: INITIAL_PRODUCTS, orders: INITIAL_ORDERS };
  }
}

const db = new LocalDatabase(DB_FILE);

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json({ limit: '15mb' })); // Support base64 image uploads from admin

// Log requests in dev
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});

// Admin Authorization check helper
function checkAdminAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  // Allow if matches configured token, or fallback development tokens
  const currentEnvToken = process.env.API_SECRET_TOKEN || process.env.API_SECRET_TOKEN_new || API_SECRET_TOKEN;
  const validTokens = [currentEnvToken, 'admin-secret-token', 'admin-token-2024'];
  if (token && validTokens.includes(token)) {
    return next();
  }

  return res.status(401).json({
    success: false,
    error: 'Unauthorized: Invalid or missing admin token'
  });
}

// ==================== API ENDPOINTS ====================

// Admin Login Authentication endpoint
// Returns the active API_SECRET_TOKEN so admin.html dynamically syncs with Vercel/server env vars
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const expectedUser = process.env.ADMIN_USERNAME || 'Admin';
  const expectedPass = process.env.ADMIN_PASSWORD || 'Admin@123';
  const currentToken = process.env.API_SECRET_TOKEN || process.env.API_SECRET_TOKEN_new || API_SECRET_TOKEN || 'admin-secret-token';

  if (username === expectedUser && password === expectedPass) {
    return res.json({
      success: true,
      message: 'Login successful',
      token: currentToken
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid username or password'
  });
});

// Health & System Info
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    storeName: 'Sri Balu Electronics & Furnitures',
    timestamp: new Date().toISOString()
  });
});

// Database Status endpoint
app.get('/api/db-status', (req, res) => {
  const products = db.getProducts();
  const orders = db.getOrders();
  res.json({
    success: true,
    database: {
      type: 'Embedded Local Persistent Database (JSON / File Storage)',
      status: 'Connected 🟢',
      location: DB_FILE,
      availableAdapters: ['Local File DB (active)', 'Supabase (PostgreSQL)', 'MongoDB Atlas', 'Vercel KV']
    },
    counts: {
      totalProducts: products.length,
      publishedProducts: products.filter(p => p.published).length,
      totalOrders: orders.length,
      newOrders: orders.filter(o => o.status === 'New').length
    }
  });
});

// Reset Demo Data (Admin protected)
app.post('/api/seed', checkAdminAuth, (req, res) => {
  const result = db.resetDemo();
  res.json({ success: true, message: 'Database reset to demo data', data: result });
});

// --- PRODUCTS API ---

// GET /api/products (Public read)
app.get('/api/products', (req, res) => {
  try {
    const products = db.getProducts();
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/products (Admin create)
app.post('/api/products', checkAdminAuth, (req, res) => {
  try {
    const { name, brand, category, price, discount, description, image, colors, published } = req.body;
    if (!name || !category || price === undefined) {
      return res.status(400).json({ success: false, error: 'Missing name, category, or price' });
    }

    const newProduct = {
      id: `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      brand: brand ? brand.trim() : '',
      category,
      price: parseFloat(price) || 0,
      discount: parseFloat(discount) || 0,
      description: description ? description.trim() : '',
      image: image || null,
      published: published === true || published === 'true',
      colors: Array.isArray(colors) ? colors : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = db.saveProduct(newProduct);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/products/:id (Admin update)
app.put('/api/products/:id', checkAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (updates.price !== undefined) updates.price = parseFloat(updates.price) || 0;
    if (updates.discount !== undefined) updates.discount = parseFloat(updates.discount) || 0;

    const updated = db.updateProduct(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/products/:id (Admin toggle publish)
app.patch('/api/products/:id', checkAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const toggled = db.togglePublishProduct(id);
    if (!toggled) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: toggled });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/products/:id (Admin delete)
app.delete('/api/products/:id', checkAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const success = db.deleteProduct(id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- ORDERS API ---

// GET /api/orders (Admin list)
app.get('/api/orders', checkAdminAuth, (req, res) => {
  try {
    const orders = db.getOrders();
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/orders (Public customer submission)
app.post('/api/orders', (req, res) => {
  try {
    const { type, customerName, phone, message, address, notes, items, total } = req.body;
    if (!type || !customerName || !phone) {
      return res.status(400).json({ success: false, error: 'Missing required fields: type, customerName, phone' });
    }

    const orderType = type === 'query' ? 'query' : 'order';
    const newOrder = {
      id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: orderType,
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: address ? address.trim() : '',
      notes: notes ? notes.trim() : '',
      message: message ? message.trim() : '',
      items: Array.isArray(items) ? items : [],
      total: parseFloat(total) || 0,
      status: 'New',
      createdAt: new Date().toISOString()
    };

    const saved = db.createOrder(newOrder);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/orders/:id (Admin update status)
app.patch('/api/orders/:id', checkAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, error: 'Missing status' });

    const updated = db.updateOrderStatus(id, status);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/orders/:id (Admin delete order)
app.delete('/api/orders/:id', checkAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const success = db.deleteOrder(id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== STATIC ROUTES ====================
// Serve static assets
app.use(express.static(__dirname));

// Route handlers for convenient URLs
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'customer.html'));
});

app.get('/customer', (req, res) => {
  res.sendFile(path.join(__dirname, 'customer.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log('\n=============================================================');
  console.log('✨ Sri Balu Electronics & Furnitures - Unified Server Running!');
  console.log(`🌐 Customer Store: http://localhost:${PORT}/ (or http://localhost:${PORT}/customer)`);
  console.log(`🔒 Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`💾 Database Mode: Embedded Persistent Storage (${DB_FILE})`);
  console.log(`🔑 Admin Login: User: Admin | Pass: Admin@123`);
  console.log('=============================================================\n');
});
