import { create } from 'zustand';
import { User } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    setUser: (user: User | null) => void;
    signOut: () => Promise<void>;
    checkAuth: () => Promise<void>;
    initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isInitialized: false,

    setUser: (user) => {
        set({ user, isAuthenticated: !!user });
    },

    signOut: async () => {
        try {
            set({ isLoading: true });
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Sign out error:', error);
        } finally {
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    checkAuth: async () => {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
                console.error('Session error:', sessionError);
                return;
            }

            if (session?.user) {
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (!userError && userData) {
                    set({
                        user: userData,
                        isAuthenticated: true,
                    });
                    return;
                }
            }

            set({
                user: null,
                isAuthenticated: false,
            });
        } catch (error) {
            console.error('Auth check error:', error);
            set({
                user: null,
                isAuthenticated: false,
            });
        }
    },

    initialize: async () => {
        const state = get();
        if (state.isInitialized) return;

        set({ isLoading: true });

        // Auth state listener
        supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event);

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
                if (session?.user) {
                    const { data: userData } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (userData) {
                        set({
                            user: userData,
                            isAuthenticated: true,
                        });
                    }
                }
            } else if (event === 'SIGNED_OUT') {
                set({
                    user: null,
                    isAuthenticated: false,
                });
            }
        });

        // İlk auth kontrolü
        await get().checkAuth();

        set({ isInitialized: true, isLoading: false });
    },
}));