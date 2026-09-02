-- ==============================================================================
-- SRI BALU ELECTRONICS & FURNITURES - SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Run this script in your Supabase project:
-- Dashboard -> SQL Editor -> Click "+ New query" -> Paste & Run!
-- ==============================================================================

-- 1. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT DEFAULT '',
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  description TEXT DEFAULT '',
  image TEXT,
  published BOOLEAN DEFAULT true,
  colors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'order', -- 'order' or 'query'
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT,
  address TEXT,
  notes TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'New', -- 'New', 'Contacted', 'Completed', 'Cancelled'
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. Create Settings Table (for store announcements, banner messages, and configuration)
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Insert default announcement message
INSERT INTO public.settings (key, value)
VALUES (
  'announcement',
  '{"text": "Special Offer: Free delivery & installation in Erode on all orders above ₹10,000!", "enabled": true}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view settings" ON public.settings;
CREATE POLICY "Public can view settings" ON public.settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow full access to settings" ON public.settings;
CREATE POLICY "Allow full access to settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

-- 4. Policies for Products
-- Allow anyone to view published products
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" 
  ON public.products FOR SELECT 
  USING (true);

-- Allow inserting, updating, deleting products (authenticated or via API)
DROP POLICY IF EXISTS "Allow full access to products" ON public.products;
CREATE POLICY "Allow full access to products" 
  ON public.products FOR ALL 
  USING (true)
  WITH CHECK (true);

-- 5. Policies for Orders
-- Allow anyone to submit orders & queries
DROP POLICY IF EXISTS "Public can submit orders" ON public.orders;
CREATE POLICY "Public can submit orders" 
  ON public.orders FOR INSERT 
  WITH CHECK (true);

-- Allow viewing and updating orders
DROP POLICY IF EXISTS "Allow full access to orders" ON public.orders;
CREATE POLICY "Allow full access to orders" 
  ON public.orders FOR ALL 
  USING (true)
  WITH CHECK (true);

-- 6. Insert Initial Demo Products (Optional seed data)
INSERT INTO public.products (id, name, brand, category, price, discount, description, image, published, colors)
VALUES 
  ('id_demo_tv_01', 'Samsung 43" Crystal 4K Smart TV', 'Samsung', 'electronics', 28990, 15, 'Ultra HD 4K LED Smart TV with HDR10+, Dolby Audio, voice remote and built-in streaming apps.', 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&auto=format&fit=crop&q=80', true, '[{"id":"c1","name":"Gloss Black","hex":"#1B2A4A"}]'::jsonb),
  ('id_demo_table_02', 'Solid Sheesham Wood 6-Seater Dining Table', 'WoodCraft', 'furniture', 21500, 10, 'Handcrafted premium Sheesham wood dining table set with 6 comfortable cushioned chairs in walnut finish.', 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&auto=format&fit=crop&q=80', true, '[{"id":"c2","name":"Walnut Dark","hex":"#6B4226"},{"id":"c3","name":"Natural Honey","hex":"#C9A86A"}]'::jsonb),
  ('id_demo_speaker_03', 'JBL Charge 5 Portable Bluetooth Speaker', 'JBL', 'electronics', 14999, 12, 'Waterproof IP67 portable speaker with 20 hours playtime, powerbank feature, and signature deep bass.', 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80', true, '[{"id":"c4","name":"Fiery Red","hex":"#B54747"},{"id":"c5","name":"Midnight Black","hex":"#1B2A4A"},{"id":"c6","name":"Ocean Blue","hex":"#3B5BA5"}]'::jsonb),
  ('id_demo_sofa_04', 'Luxury 3-Seater Fabric Recliner Sofa', 'Urban Living', 'furniture', 34999, 8, 'Ergonomic high-density foam recliner sofa with breathable velvet fabric and sturdy hardwood frame.', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80', true, '[{"id":"c7","name":"Slate Grey","hex":"#4A5568"},{"id":"c8","name":"Warm Cream","hex":"#E2D9C9"}]'::jsonb),
  ('id_demo_purifier_05', 'Kaviya 10-Stage RO+UV+Alkaline Water Purifier', 'Kaviya', 'rowater', 11499, 18, 'Advanced 10-stage RO+UV+UF+TDS control with 10L food-grade storage and active copper alkaline boost.', 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&auto=format&fit=crop&q=80', true, '[{"id":"c9","name":"Arctic White","hex":"#FFFFFF"},{"id":"c10","name":"Piano Black","hex":"#1B2A4A"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;
