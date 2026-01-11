import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://iaeierzfvfbpwdqkrwhd.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_wM9Ana0iti-xKTCc4ogAEw_n75Fh3I6';

export const supabase = createClient(supabaseUrl, supabaseKey);
