# Voices of Support

A private emotional support platform for soldiers. Soldiers log in and receive video messages, audio messages, and written letters from family and people around the world.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React, Tailwind CSS, TypeScript
- **Backend:** Supabase (Auth + PostgreSQL + Storage)

---

## 1. Supabase Project Setup

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy your **Project URL** and **anon public key** from Settings → API

---

## 2. Database Schema

Run this SQL in your Supabase **SQL Editor**:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (mirrors auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  sender_name TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('family', 'global')),
  type TEXT NOT NULL CHECK (type IN ('video', 'audio', 'letter')),
  media_url TEXT,
  thumbnail_url TEXT,
  transcript TEXT,
  content_text TEXT,
  duration NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved messages
CREATE TABLE public.saved_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, message_id)
);

-- Read status
CREATE TABLE public.read_status (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  is_read BOOLEAN DEFAULT TRUE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, message_id)
);

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.read_status ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own record" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own record" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own record" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Messages policies (authenticated users can read/insert)
CREATE POLICY "Authenticated users can read messages" ON public.messages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (true);

-- Saved messages policies
CREATE POLICY "Users manage own saved messages" ON public.saved_messages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Read status policies
CREATE POLICY "Users manage own read status" ON public.read_status
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

## 3. Storage Bucket Setup

1. In Supabase dashboard → **Storage** → New Bucket
2. Name: `media`
3. **Public bucket:** ✅ enabled

Then run this SQL to set storage policies:

```sql
-- Allow authenticated users to upload media
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');

-- Allow public read access to media
CREATE POLICY "Public can view media" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

-- Allow users to update/delete their own uploads
CREATE POLICY "Users can manage own uploads" ON storage.objects
  FOR ALL TO authenticated USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 4. Authentication Settings

In Supabase Dashboard → **Authentication** → **Settings**:

- **Email confirmations:** Disable for local dev (or keep enabled for production)
- If disabled, users can sign in immediately after signup

---

## 5. Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 6. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 7. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect the GitHub repo at [vercel.com/new](https://vercel.com/new) and add the two environment variables in Vercel → Settings → Environment Variables.

---

## App Structure

| Route | Description |
|---|---|
| `/login` | Email/password sign in |
| `/signup` | Create account |
| `/home` | Messages of Support (Family + World sections) |
| `/letters` | All letter messages |
| `/audio` | All audio messages |
| `/create` | Create a new message (multi-step upload) |
| `/vault` | Saved messages with filters |
| `/message/[id]` | Full message view (video/audio/letter) |
| `/admin/upload` | Admin: send message to any user by their UUID |

---

## Adding Messages to a Soldier

**Via /create:** Any logged-in user can create messages for their own account.

**Via /admin/upload:** Navigate to `/admin/upload` to send a message to a specific soldier — enter their Supabase user UUID as the Target User ID. You can find UUIDs in Supabase Dashboard → Authentication → Users.
