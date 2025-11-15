import { create } from 'zustand';
import { User } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    signOut: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    setUser: (user) => {
        set({ user, isAuthenticated: !!user });
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false });
    },

    checkAuth: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                set({
                    user: userData,
                    isAuthenticated: true,
                    isLoading: false
                });
            } else {
                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false
                });
            }
        } catch (error) {
            console.error('Auth check error:', error);
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false
            });
        }
    },
}));