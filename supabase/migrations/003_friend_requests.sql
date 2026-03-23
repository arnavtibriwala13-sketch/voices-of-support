-- Add linked_user_id to contacts (set when friend request accepted)
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS linked_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Friend requests table
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  sender_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_user_id, recipient_email)
);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- Sender can manage (CRUD) their own sent requests
CREATE POLICY "Sender manages own requests" ON public.friend_requests
  FOR ALL USING (auth.uid() = sender_user_id)
  WITH CHECK (auth.uid() = sender_user_id);

-- Recipient can view requests sent to their email
CREATE POLICY "Recipient can view requests" ON public.friend_requests
  FOR SELECT USING (
    recipient_user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND email = friend_requests.recipient_email)
  );

-- Recipient can update (accept/decline) requests sent to them
CREATE POLICY "Recipient can respond" ON public.friend_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND email = friend_requests.recipient_email)
  );

-- Trigger: when request accepted, auto-populate linked_user_id on sender's contact
CREATE OR REPLACE FUNCTION handle_friend_request_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    UPDATE public.contacts
    SET linked_user_id = NEW.recipient_user_id
    WHERE owner_user_id = NEW.sender_user_id
      AND email = NEW.recipient_email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_friend_request_accepted
  AFTER UPDATE ON public.friend_requests
  FOR EACH ROW EXECUTE FUNCTION handle_friend_request_accepted();

-- Enable realtime for messages and friend_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;
