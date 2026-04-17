import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sjrinqsekowhgtikhnvv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqcmlucXNla293aGd0aWtobnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzODY5NTMsImV4cCI6MjA5MTk2Mjk1M30.qeGOQF6G3YOs_LSiSFBC0cGNWU_pVYWrJ50YDciDGj8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
