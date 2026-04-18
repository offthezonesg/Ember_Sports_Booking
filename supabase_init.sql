-- ============================================
-- EMBER SPORTS - SUPABASE DATABASE INITIALIZATION
-- Execute this in Supabase SQL Editor
-- ============================================

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  nickname TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  is_first_login BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE public.profiles IS 'User profiles with onboarding status';

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for profiles
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Service role can insert (for initial profile creation)
CREATE POLICY "Service role can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);

-- 4. Add payment fields to court_bookings table (if exists)
-- Check if court_bookings table exists first
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'court_bookings') THEN
    -- Add payment_status column if not exists
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'court_bookings' AND column_name = 'payment_status') THEN
      ALTER TABLE public.court_bookings ADD COLUMN payment_status TEXT DEFAULT 'pending';
    END IF;
    
    -- Add airwallex_intent_id column if not exists
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'court_bookings' AND column_name = 'airwallex_intent_id') THEN
      ALTER TABLE public.court_bookings ADD COLUMN airwallex_intent_id TEXT;
    END IF;
    
    COMMENT ON COLUMN public.court_bookings.payment_status IS 'Payment status: pending, paid, failed, refunded';
    COMMENT ON COLUMN public.court_bookings.airwallex_intent_id IS 'Airwallex payment intent ID';
  END IF;
END $$;

-- 5. Create indexes for better query performance
-- Index for court bookings by date
CREATE INDEX IF NOT EXISTS idx_bookings_court_date 
  ON public.court_bookings (court_id, start_time);

-- Index for user bookings by status
CREATE INDEX IF NOT EXISTS idx_bookings_user_status 
  ON public.court_bookings (user_id, status);

-- Index for profiles lookup
CREATE INDEX IF NOT EXISTS idx_profiles_email 
  ON public.profiles (email);

-- 6. Create updated_at trigger for profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION QUERIES (Run these to verify setup)
-- ============================================

-- Check if tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Check indexes
-- SELECT indexname FROM pg_indexes WHERE tablename = 'court_bookings';

-- ============================================
-- NOTES:
-- ============================================
-- 1. profiles table links to auth.users via id (UUID)
-- 2. is_first_login defaults to TRUE, set to FALSE after onboarding
-- 3. RLS ensures users can only access their own data
-- 4. Indexes optimize booking queries and lookups
-- 5. Payment fields added to court_bookings for Airwallex integration
