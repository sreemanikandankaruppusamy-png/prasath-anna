# 🚀 STEP-BY-STEP DEPLOYMENT GUIDE

Complete instructions for deploying Admin & Customer apps to Vercel with shared live data.

---

## Phase 1: Local Development (5 minutes)

### 1.1 Prerequisites
- Have Node.js 16+ installed
- Create a Vercel account: https://vercel.com/signup
- Install Vercel CLI globally:
  ```bash
  npm install -g vercel
  ```

### 1.2 Navigate to Project
```bash
cd "c:\Users\sreem\OneDrive\Desktop\prasath anna"
```

### 1.3 Install Dependencies
```bash
npm install
```

### 1.4 Link to Vercel
```bash
vercel link
```
- Choose: **Create a new project**
- Project name: `sri-balu-store` (or your choice)
- Framework: `Other`
- Root directory: `.` (leave as is)

### 1.5 Create Vercel KV Database
Go to: https://vercel.com/dashboard
1. Click **your project name** (sri-balu-store)
2. Go to **Storage** tab
3. Click **Create Database**
4. Choose **KV**
5. Name: `default` (or `sri-balu-kv`)
6. Region: Choose closest to India (Mumbai recommended)
7. Click **Create**
8. Wait 2-3 minutes for activation

### 1.6 Pull Environment Variables
```bash
vercel env pull
```
This creates/updates `.env.local` with `KV_URL`

### 1.7 Set API Secret Token
Edit `.env.local` and update both lines:
```
KV_URL=redis://default:...@... (auto-filled, don't change)
API_SECRET_TOKEN=my-super-secure-admin-token-2024
NEXT_PUBLIC_API_SECRET_TOKEN=my-super-secure-admin-token-2024
```

Choose a strong token (at least 20 characters):
```bash
# Generate one using OpenSSL (if available):
openssl rand -base64 32

# Or just use: my-super-secret-admin-token-2024
```

### 1.8 Start Development Server
```bash
npm run dev
```

Output should show:
```
 ▲ Vercel CLI 32.0.0
 ✓ Linked to [your-username]/sri-balu-store (created .vercel)
 ✓ Environments configured
 Ready! Available at:
  > http://localhost:3000
  > http://localhost:3000/admin.html
  > http://localhost:3000/customer.html
```

### 1.9 Test Locally
Open in browser:
- **Admin**: http://localhost:3000/admin.html
  - Login: `Admin` / `Admin@123`
  - Add a test product
  - Click "Publish"
- **Customer**: http://localhost:3000/customer.html
  - Should see the product
  - Try filtering and adding to cart

### 1.10 Fix Issues
If you get errors:

**Error: "KV_URL is not defined"**
```bash
vercel env pull
cat .env.local  # Check if KV_URL is there
```

**Error: "Unauthorized" on Admin operations**
- Check `.env.local` has `API_SECRET_TOKEN`
- Refresh Admin page after updating `.env.local`

**Error: "KV connection failed"**
- KV database might still be initializing
- Wait 5 minutes and try again
- Check KV status in Vercel Dashboard → Storage

---

## Phase 2: Production Deployment (10 minutes)

### 2.1 Prepare for Production
Edit `.env.local` and change API token to something new:
```
API_SECRET_TOKEN=production-admin-token-super-secure-12345
NEXT_PUBLIC_API_SECRET_TOKEN=production-admin-token-super-secure-12345
```

**IMPORTANT**: Use a DIFFERENT token than development!

### 2.2 Push to Vercel (via CLI)
```bash
# Set production environment variable
vercel env add API_SECRET_TOKEN
# When prompted, enter: production-admin-token-super-secure-12345
# Select: Production environment only

vercel env add NEXT_PUBLIC_API_SECRET_TOKEN
# When prompted, enter: production-admin-token-super-secure-12345
# Select: Production environment only

# Deploy to production
vercel --prod
```

Or via **Vercel Dashboard**:
1. Go to https://vercel.com/dashboard/[your-project]
2. Click **Settings** → **Environment Variables**
3. Add:
   ```
   API_SECRET_TOKEN = production-admin-token-super-secure-12345
   ```
   - Environments: Production ✓
4. Add:
   ```
   NEXT_PUBLIC_API_SECRET_TOKEN = production-admin-token-super-secure-12345
   ```
   - Environments: Production ✓

Then deploy:
```bash
vercel --prod
```

### 2.3 Verify Deployment
After deployment, you'll see:
```
✓ Deployed to production [your-deployment-url]
```

Test both URLs:
- **Admin**: `https://[your-deployment-url].vercel.app/admin.html`
- **Customer**: `https://[your-deployment-url].vercel.app/customer.html`

### 2.4 Use Custom Domain (Optional)
1. Go to Vercel Dashboard → Project → Settings → Domains
2. Enter your domain: `store.yourdomain.com`
3. Follow DNS instructions
4. Wait 5-10 minutes for SSL certificate

Then access:
- `https://store.yourdomain.com/admin.html`
- `https://store.yourdomain.com/customer.html`

---

## Phase 3: Production Synchronization (2 deployments)

If you have **separate Vercel projects for Admin and Customer** (advanced):

### 3.1 Create Two Projects
```bash
# Terminal 1: Admin project
cd /path/to/admin-project
vercel link
# Project name: sri-balu-admin

# Terminal 2: Customer project
cd /path/to/customer-project
vercel link
# Project name: sri-balu-customer
```

### 3.2 Link Both to SAME KV Database
**For both projects:**
1. Vercel Dashboard → Project → Storage
2. Click **Connect Database**
3. Choose the existing `sri-balu-kv` database
4. Click **Connect**

### 3.3 Set Environment Variables in Both
**Admin Project:**
```
API_SECRET_TOKEN = production-admin-token-super-secure-12345
NEXT_PUBLIC_API_SECRET_TOKEN = production-admin-token-super-secure-12345
```

**Customer Project:**
```
# No API_SECRET_TOKEN needed (customers don't edit)
# KV database is shared automatically
```

### 3.4 Deploy Both
```bash
# Admin
cd /path/to/admin-project
vercel --prod

# Customer
cd /path/to/customer-project
vercel --prod
```

### 3.5 Test Cross-Domain Sync
1. Open Admin: `https://sri-balu-admin.vercel.app/admin.html`
2. Add a product and publish
3. Wait 10 seconds
4. Open Customer: `https://sri-balu-customer.vercel.app/customer.html`
5. Should see the product ✓

---

## Phase 4: Configuration & Security

### 4.1 Update Admin Credentials (REQUIRED FOR PRODUCTION)
Edit `admin.html`, find and replace:
```javascript
const ADMIN_USER = 'Admin';
const ADMIN_PASS = 'Admin@123';
```

With:
```javascript
const ADMIN_USER = 'your-real-username';
const ADMIN_PASS = 'your-strong-password-123456';
```

Then redeploy:
```bash
vercel --prod
```

### 4.2 Set CORS Origin (Optional, for Security)
Edit `api/products/index.ts` and `api/orders/index.ts`:

Change:
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
```

To:
```javascript
const allowedOrigins = ['https://store.yourdomain.com', 'https://admin-store.yourdomain.com'];
const origin = req.headers.origin;
if (allowedOrigins.includes(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin);
}
```

Then redeploy.

### 4.3 Enable Vercel Analytics & Monitoring
1. Go to Vercel Dashboard → Project → Settings → Analytics
2. Enable **Web Analytics**
3. Enable **Real-time Analytics** (optional, paid)

### 4.4 Set Up Error Notifications (Optional)
Vercel → Project → Settings → Integrations
- Connect Slack for deployment notifications
- Set up email alerts

---

## Phase 5: Testing Checklist

### Admin Functionality
- [ ] Login with credentials
- [ ] Add a product
- [ ] Upload product image
- [ ] Add color variants
- [ ] Edit product
- [ ] Publish product
- [ ] View dashboard stats
- [ ] Receive customer orders
- [ ] Change order status
- [ ] Delete product/order
- [ ] Logout

### Customer Functionality
- [ ] View published products
- [ ] Filter by category
- [ ] Search products
- [ ] View product details
- [ ] Select color variant
- [ ] Adjust quantity
- [ ] Add to cart
- [ ] Open cart drawer
- [ ] Proceed to checkout
- [ ] Submit order
- [ ] Submit query/question
- [ ] See confirmation message

### Synchronization
- [ ] Admin publishes product → Customer sees instantly
- [ ] Customer places order → Admin receives it
- [ ] Admin status change → Reflects in database
- [ ] Multiple tabs/windows stay in sync
- [ ] Works across different Vercel domains (if separated)

---

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot find module @vercel/kv" | Run `npm install` |
| "KV connection error" | Check KV database is created in Storage tab |
| "Unauthorized 401" | Check API_SECRET_TOKEN in .env.local and Vercel env |
| "Products not showing" | Must be Published (admin-only status) |
| "Orders not sending" | Check browser console for API errors |
| "Styles look broken" | Clear browser cache (Ctrl+Shift+Delete) |
| "Old data still showing" | Vercel caches static files for 60s - wait or hard refresh |

---

## 📞 Post-Deployment

### Monitor Performance
- Vercel Dashboard → Project → Monitoring
- Check Function Invocations & Compute Time
- Check Storage (KV database size)

### Regular Maintenance
- Backup order data regularly (manual export or integration)
- Monitor KV database size (auto-scales, but monitor costs)
- Review analytics for popular products
- Update products based on customer queries

### Scale & Optimization
- If traffic grows, consider:
  - Adding caching headers
  - Moving large images to Vercel Blob
  - Adding rate limiting
  - Database indexing (advanced)

---

## 📋 Configuration Summary

**Production URLs** (example):
- Admin: `https://sri-balu-admin.vercel.app/admin.html`
- Customer: `https://sri-balu-customer.vercel.app/customer.html`

**Environment Variables**:
```
KV_URL = redis://default:[PASSWORD]@[HOST]:[PORT]
API_SECRET_TOKEN = production-admin-token-super-secure-12345
NEXT_PUBLIC_API_SECRET_TOKEN = production-admin-token-super-secure-12345
```

**Database**:
- Type: Vercel KV (Redis)
- Keys: `sbef:products`, `sbef:orders`
- Region: Singapore/Mumbai (closest to India)

**Admin Credentials**:
- Username: `your-real-username`
- Password: `your-strong-password-123456`

---

**Deployment Status: ✅ READY FOR PRODUCTION**

Good luck with your Sri Balu store! 🎉
