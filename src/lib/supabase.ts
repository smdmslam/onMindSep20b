import { createClient } from '@supabase/supabase-js';
import type { Category } from './constants';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Function to clear auth storage
function clearAuthStorage() {
  localStorage.removeItem('on-mind-auth');
  localStorage.removeItem('supabase.auth.token');  // Clear any legacy tokens
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'on-mind-auth',
    storage: window.localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'on-mind@1.0.0'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Listen for auth state changes and handle errors
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED' && !session) {
    clearAuthStorage();
    window.location.reload();
  }
});

export type Entry = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  explanation: string;
  url?: string;
  category: Category;
  tags: string[];
  is_favorite: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type AuthUser = {
  id: string;
  email: string;
};

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  try {
    console.log('Starting Google sign-in process...');
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });
    
    if (error) {
      console.error('OAuth error:', error);
      throw error;
    }
    
    console.log('OAuth response:', data);
    return data;
  } catch (error) {
    console.error('Error in signInWithGoogle:', error);
    throw error;
  }
}

export async function signOut() {
  clearAuthStorage(); // Clear stored auth data before signing out
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}