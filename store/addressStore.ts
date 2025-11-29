import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Address } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface AddressState {
    addresses: Address[];
    selectedAddress: Address | null;
    loading: boolean;
    subscription: RealtimeChannel | null;
    loadAddresses: (userId: string) => Promise<void>;
    setSelectedAddress: (address: Address | null) => void;
    clearSelectedAddress: () => void;
    refreshAddresses: (userId: string) => Promise<void>;
    subscribeToAddresses: (userId: string) => void;
    unsubscribeFromAddresses: () => void;
}

export const useAddressStore = create<AddressState>()(
    persist(
        (set, get) => ({
            addresses: [],
            selectedAddress: null,
            loading: false,
            subscription: null,

            loadAddresses: async (userId: string) => {
                set({ loading: true });
                try {
                    const { data, error } = await supabase
                        .from('addresses')
                        .select('*')
                        .eq('user_id', userId)
                        .order('is_default', { ascending: false });

                    if (error) throw error;

                    if (data) {
                        set({ addresses: data });

                        const currentSelected = get().selectedAddress;
                        if (!currentSelected || !data.find(a => a.id === currentSelected.id)) {
                            const defaultAddress = data.find(addr => addr.is_default) || data[0];
                            set({ selectedAddress: defaultAddress || null });
                        } else {
                            const updatedSelected = data.find(a => a.id === currentSelected.id);
                            if (updatedSelected) {
                                set({ selectedAddress: updatedSelected });
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error loading addresses:', error);
                } finally {
                    set({ loading: false });
                }
            },

            refreshAddresses: async (userId: string) => {
                await get().loadAddresses(userId);
            },

            setSelectedAddress: (address) => {
                set({ selectedAddress: address });
            },

            clearSelectedAddress: () => {
                set({ selectedAddress: null });
            },

            subscribeToAddresses: (userId: string) => {
                get().unsubscribeFromAddresses();

                const channel = supabase
                    .channel(`addresses:${userId}`)
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'addresses',
                            filter: `user_id=eq.${userId}`,
                        },
                        (payload) => {
                            console.log('Address change detected:', payload);
                            get().loadAddresses(userId);
                        }
                    )
                    .subscribe();

                set({ subscription: channel });
            },

            unsubscribeFromAddresses: () => {
                const { subscription } = get();
                if (subscription) {
                    supabase.removeChannel(subscription);
                    set({ subscription: null });
                }
            },
        }),
        {
            name: 'address-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                addresses: state.addresses,
                selectedAddress: state.selectedAddress,
                loading: state.loading,
            }),
        }
    )
);