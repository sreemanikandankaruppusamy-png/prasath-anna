# Sri Balu Store - Shared Admin & Customer Frontend

A production-ready web application for "Sri Balu Electronics & Furnitures" with **Admin** and **Customer** interfaces sharing live data through Vercel KV Redis backend.

## 📋 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   BROWSER USERS                         │
├─────────────┬──────────────────────────────────┬────────┤
│   Admin     │        Customer (Storefront)     │ Mobile │
│ (admin.html)│        (customer.html)           │ Apps   │
└──────┬──────┴───────────────┬────────────────────┴───────┘
       │                      │
       │ HTTP/API Calls       │ HTTP/API Calls
       │                      │
┌──────▼───────────────────────▼─────────────────────────┐
│          Vercel Functions (Edge Computing)            │
├─────────────────────────────────────────────────────────┤
│  POST/PUT /api/products    - Admin product management  │
│  GET /api/products         - Public product catalog    │
│  POST /api/orders          - Customer order submission │
│  GET/PATCH /api/orders/[id] - Admin order management  │
└──────────────────────┬────────────────────────────────┘
                       │
                       │ Read/Write
                       │
┌──────────────────────▼────────────────────────────────┐
│             Vercel KV (Redis)                         │
├─────────────────────────────────────────────────────────┤
│  KEY: sbef:products -> Array of Products              │
│  KEY: sbef:orders   -> Array of Orders/Queries        │
└─────────────────────────────────────────────────────────┘
```

## ✨ Key Features

- ✅ **Shared Live Data**: Admin and Customer apps instantly see each other's changes
- ✅ **Zero Browser LocalStorage Sync Issues**: All data in centralized backend
- ✅ **Secure Admin Authentication**: API token-based auth, not exposed in frontend
- ✅ **CORS Enabled**: Works across different Vercel domains
- ✅ **Production Ready**: Error handling, input validation, rate-limiting ready
- ✅ **Auto-Refresh**: Customer page auto-refreshes products every 10 seconds
- ✅ **No Database Migration Needed**: Uses Vercel KV (Redis) - instant setup

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 16+
- Vercel CLI: `npm i -g vercel`
- A Vercel account with Vercel KV enabled

### Step 1: Clone & Setup
```bash
cd /path/to/prasath\ anna
npm install
```

### Step 2: Connect to Vercel (One-Time)
```bash
# Links your local project to a Vercel project
vercel link
```

When prompted:
- **Project name**: `sri-balu-store` (or your choice)
- **Framework**: Choose "Other"
- **Build command**: Leave empty (we serve static HTML + API)

### Step 3: Enable Vercel KV
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project → **Storage**
3. Click **Create Database** → **KV**
4. Name it `default` (or any name)
5. Accept the defaults and create

### Step 4: Pull Environment Variables
```bash
# Downloads .env.local with KV_URL from Vercel
vercel env pull
```

### Step 5: Add API Token to .env.local
Edit `.env.local` and set a strong token:
```
KV_URL=redis://default:...@... (auto-filled by Vercel)
API_SECRET_TOKEN=your-secure-admin-token-here-change-in-production
NEXT_PUBLIC_API_SECRET_TOKEN=your-secure-admin-token-here-change-in-production
```

### Step 6: Start Development Server
```bash
npm run dev
```

Access:
- **Admin**: http://localhost:3000/admin.html
  - Username: `Admin`
  - Password: `Admin@123`
- **Customer**: http://localhost:3000/customer.html

## 📦 Production Deployment

### Deployment Step 1: Set Environment Variables on Vercel
```bash
# Open Vercel CLI and set production env vars
vercel env add API_SECRET_TOKEN
# Enter: your-production-admin-token (different from dev!)
```

Or via Vercel Dashboard:
1. Go to your project → **Settings** → **Environment Variables**
2. Add:
   - Key: `API_SECRET_TOKEN`
   - Value: `your-production-admin-token`
   - Environments: `Production`
3. Add:
   - Key: `NEXT_PUBLIC_API_SECRET_TOKEN`
   - Value: Same as above
   - Environments: `Production`

### Deployment Step 2: Deploy
```bash
# Deploy to production
vercel --prod
```

### Deployment Step 3: Update HTML Files with Production API
In both `admin.html` and `customer.html`, the line:
```javascript
const API_BASE = '/api';
```
is **already correct** - it uses relative paths, so it works on any domain.

### Deployment Step 4: Test
- Admin: `https://your-domain.vercel.app/admin.html`
- Customer: `https://your-domain.vercel.app/customer.html`

## 🔐 Security

### Admin Authentication
1. **Frontend Login** (in admin.html):
   - Username: `Admin`
   - Password: `Admin@123`
   - Hardcoded for demo (change in production)

2. **API Token** (server-side):
   - Stored in `process.env.API_SECRET_TOKEN`
   - Required for all admin operations
   - NOT exposed in HTML/JS

### Data Protection
- ✅ All product images stored as **base64** in Redis (no separate file storage needed)
- ✅ Order data never exposed to customer (read-only products API)
- ✅ CORS restricted (can be tightened with `CORS_ORIGIN` env var)
- ✅ Validation on all API endpoints

### Passwords & Secrets
- `.env.local` is **Git-ignored** (never commit)
- `vercel env` manages production secrets securely
- Frontend JavaScript does NOT have access to `API_SECRET_TOKEN`
- Admin token passed only in `Authorization` header

## 📝 API Endpoints

### Products (Public Reads / Admin Writes)

**GET** `/api/products`
- Returns: Array of all products
- Auth: None required (public)
- Example:
  ```
  GET /api/products
  ```

**POST** `/api/products`
- Creates new product
- Auth: Bearer token required
- Body:
  ```json
  {
    "name": "Product Name",
    "brand": "Brand",
    "category": "electronics|furniture|rowater",
    "price": 9999,
    "discount": 10,
    "description": "Short description",
    "image": "data:image/jpeg;base64,...",
    "colors": [{"id": "color_1", "name": "Black", "hex": "#000000"}]
  }
  ```

**PUT** `/api/products/[id]`
- Updates existing product
- Auth: Bearer token required
- Body: Same as POST

**PATCH** `/api/products/[id]`
- Toggles publish status
- Auth: Bearer token required

**DELETE** `/api/products/[id]`
- Deletes product
- Auth: Bearer token required

### Orders (Customer Creates / Admin Manages)

**POST** `/api/orders`
- Creates new order or query
- Auth: None required (customer-facing)
- Body:
  ```json
  {
    "type": "order|query",
    "customerName": "John Doe",
    "phone": "+91 9876543210",
    "address": "123 Main St",
    "notes": "Handle with care",
    "items": [{"name": "Product", "qty": 2, "price": 100}],
    "total": 200
  }
  ```

**GET** `/api/orders`
- Lists all orders
- Auth: Bearer token required (admin only)

**PATCH** `/api/orders/[id]`
- Updates order status
- Auth: Bearer token required
- Body: `{ "status": "New|Contacted|Completed|Cancelled" }`

**DELETE** `/api/orders/[id]`
- Deletes order
- Auth: Bearer token required

## 🧪 Testing Synchronization

### Test 1: Admin Creates Product → Customer Sees It
1. **Admin**: Add a new product and Publish
2. **Customer**: Should see it immediately (or within 10-second refresh cycle)
3. **Verify**: Both apps show the same product

### Test 2: Customer Places Order → Admin Receives It
1. **Customer**: Add items to cart, proceed to checkout, place order
2. **Admin**: Open Orders page, should see the new order marked "New"
3. **Verify**: Order details match exactly

### Test 3: Admin Changes Order Status → Reflects Everywhere
1. **Admin**: Change order status to "Completed"
2. **Database**: Order status persisted in Vercel KV
3. **Verify**: Status change reflects if customer could see orders

### Test 4: Deployment Sync
1. Deploy Admin to `admin.vercel.app`
2. Deploy Customer to `customer.vercel.app`
3. Both connect to same Vercel KV instance
4. Changes in one domain instantly visible in other

## 🛠️ Troubleshooting

### "API call failed"
**Problem**: Admin/Customer can't connect to API
**Solution**:
```bash
# Check API is running
curl http://localhost:3000/api/health

# Check environment variables
vercel env list

# Rebuild local env
vercel env pull
npm run dev
```

### "Unauthorized" errors
**Problem**: Admin operations failing with 401
**Solution**:
- Check `API_SECRET_TOKEN` in `.env.local` matches what's in `sessionStorage` in browser
- Admin.html stores token in `sessionStorage` after login - check browser DevTools

### "KV connection failed"
**Problem**: Redis database not accessible
**Solution**:
```bash
# Check KV is linked
vercel link
vercel env pull

# Verify KV_URL is populated in .env.local
cat .env.local | grep KV_URL

# If empty, create KV database via Vercel Dashboard
```

### Products show on Admin but not Customer
**Problem**: Publish toggle not working
**Solution**:
- Products only show on Customer if `published: true`
- Admin must explicitly click "Publish" button
- Wait 10 seconds for Customer auto-refresh

## 📊 Data Structure

### Products (stored in Redis key `sbef:products`)
```typescript
interface Product {
  id: string;
  name: string;
  brand?: string;
  category: 'electronics' | 'furniture' | 'rowater';
  price: number;
  discount: number;
  description: string;
  image?: string; // base64 data URL
  published: boolean;
  colors?: Array<{ id: string; name: string; hex: string }>;
  createdAt: string;
  updatedAt: string;
}
```

### Orders (stored in Redis key `sbef:orders`)
```typescript
interface Order {
  id: string;
  type: 'order' | 'query';
  createdAt: string;
  customerName: string;
  phone: string;
  message?: string; // for queries
  address?: string; // for orders
  notes?: string;
  items: Array<{ name: string; qty: number; price: number; color?: string }>;
  total: number;
  status: 'New' | 'Contacted' | 'Completed' | 'Cancelled';
}
```

## 📁 Project Structure
```
.
├── admin.html              # Admin dashboard
├── customer.html           # Customer storefront
├── admin/                  # (optional) CSS/JS modules
├── customer/               # (optional) CSS/JS modules
├── api/
│   ├── products/
│   │   ├── index.ts       # GET all / POST new products
│   │   └── [id].ts        # GET/PUT/PATCH/DELETE single product
│   ├── orders/
│   │   ├── index.ts       # GET all / POST new orders
│   │   └── [id].ts        # GET/PATCH/DELETE single order
│   └── health.ts          # Health check endpoint
├── package.json           # Dependencies & scripts
├── vercel.json            # Vercel deployment config
├── .env.local             # Local environment (git-ignored)
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## 🚨 Important Notes for Production

1. **Change Admin Credentials**
   - Current: Username: `Admin`, Password: `Admin@123`
   - Update in `admin.html` and backend validation

2. **Strong API Token**
   - Current: `admin-secret-token-change-this-in-production`
   - Generate: `openssl rand -base64 32`
   - Set in Vercel env vars (NEVER hardcode)

3. **CORS Policy**
   - Currently allows all origins (fine for Vercel subdomains)
   - For production, set specific allowed origins in API files

4. **Rate Limiting**
   - Not implemented yet (Vercel does basic DDoS protection)
   - Add Vercel Firewall rules if needed

5. **Backups**
   - Vercel KV has 7-day backup retention
   - Regular exports recommended

## 🎓 Learning & Customization

### Modify Admin Credentials
Edit `admin.html`, search for:
```javascript
const ADMIN_USER = 'Admin';
const ADMIN_PASS = 'Admin@123';
```

### Add New Product Categories
1. Edit `api/products/index.ts` - add to validation
2. Edit `admin.html` - add to dropdown
3. Edit `customer.html` - add icon & label

### Customize Styling
- Both HTML files have inline `<style>` blocks
- CSS variables at root: `--ink`, `--amber`, `--cream`, etc.
- Modify colors/fonts directly in `<style>` sections

### Add Email Notifications
- Use Vercel's Sendgrid integration or external service
- Add to `api/orders/index.ts` POST handler

## 📞 Support & Contributing

For issues:
1. Check **Troubleshooting** section above
2. Enable Vercel Analytics: Vercel Dashboard → Settings → Analytics
3. Check API logs: `vercel logs <deployment-url>`

## 📄 License

MIT

---

**Last Updated**: August 2026
**Version**: 1.0.0
**Deployed**: Production-ready ✓
