import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

export const useAuth = () => {
    const store = useAuthStore();

    useEffect(() => {
        // Listen for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    const { data: userData } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (userData) {
                        store.setUser(userData);
                    }
                } else if (event === 'SIGNED_OUT') {
                    store.setUser(null);
                }
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    return {
        user: store.user,
        isAuthenticated: store.isAuthenticated,
        isLoading: store.isLoading,
        signOut: store.signOut,
        checkAuth: store.checkAuth,
    };
};