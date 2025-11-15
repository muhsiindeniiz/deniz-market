import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Order } from '@/lib/types';

export const useOrderPolling = (orderId: string, interval: number = 30000) => {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchOrder = async () => {
        try {
            const { data } = await supabase
                .from('orders')
                .select('*, items:order_items(*, product:products(*))')
                .eq('id', orderId)
                .single();

            if (data) {
                setOrder(data);
            }
        } catch (error) {
            console.error('Error fetching order:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();

        // Start polling
        intervalRef.current = setInterval(fetchOrder, interval);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [orderId, interval]);

    return { order, loading, refresh: fetchOrder };
};