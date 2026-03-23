-- Add recipient and creator fields to messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS recipient_type TEXT DEFAULT 'individual' CHECK (recipient_type IN ('individual', 'global')),
  ADD COLUMN IF NOT EXISTS creator_user_id UUID REFERENCES public.users(id);

-- Create contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('family', 'close')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users manage own contacts" ON public.contacts
  FOR ALL USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);

-- Update RLS on messages to allow global messages to be read by all authenticated users
DROP POLICY IF EXISTS "Authenticated users can read messages" ON public.messages;
CREATE POLICY "Users can read their messages or global messages" ON public.messages
  FOR SELECT TO authenticated USING (
    recipient_type = 'global' OR user_id = auth.uid() OR creator_user_id = auth.uid()
  );
