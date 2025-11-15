import { useCartStore } from '@/store/cartStore';

export const useCart = () => {
    const store = useCartStore();

    return {
        items: store.items,
        addItem: store.addItem,
        removeItem: store.removeItem,
        updateQuantity: store.updateQuantity,
        clearCart: store.clearCart,
        getTotal: store.getTotal,
        getItemCount: store.getItemCount,
    };
};