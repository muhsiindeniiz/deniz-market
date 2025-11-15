import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://gfeiwruteynrnheyazmh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmZWl3cnV0ZXlucm5oZXlhem1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNjQ4ODEsImV4cCI6MjA3ODY0MDg4MX0.y4LwQXF1_6f6X2fEZy4BJ_3MVZDUVmqg8mEPVvwPG7g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});