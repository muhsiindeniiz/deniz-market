import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Address } from '@/lib/types';

interface AddressState {
    selectedAddress: Address | null;
    setSelectedAddress: (address: Address | null) => void;
    clearSelectedAddress: () => void;
}

export const useAddressStore = create<AddressState>()(
    persist(
        (set) => ({
            selectedAddress: null,

            setSelectedAddress: (address) => {
                set({ selectedAddress: address });
            },

            clearSelectedAddress: () => {
                set({ selectedAddress: null });
            },
        }),
        {
            name: 'address-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);