import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Order } from '@/lib/types';
import { COLORS, ORDER_STATUS_LABELS } from '@/lib/constants';

export default function OrdersScreen() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTab, setSelectedTab] = useState<'all' | 'active' | 'completed'>('all');

    useEffect(() => {
        if (isAuthenticated) {
            loadOrders();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated, selectedTab]);

    const loadOrders = async () => {
        try {
            let query = supabase
                .from('orders')
                .select('*, items:order_items(*, product:products(*))')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (selectedTab === 'active') {
                query = query.in('status', ['pending', 'processing', 'preparing', 'on_delivery']);
            } else if (selectedTab === 'completed') {
                query = query.in('status', ['delivered', 'cancelled']);
            }

            const { data } = await query;

            if (data) setOrders(data);
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadOrders();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
            case 'processing':
            case 'preparing':
                return COLORS.warning;
            case 'on_delivery':
                return COLORS.info;
            case 'delivered':
                return COLORS.primary;
            case 'cancelled':
                return COLORS.danger;
            default:
                return COLORS.gray;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return 'time-outline';
            case 'processing':
            case 'preparing':
                return 'restaurant-outline';
            case 'on_delivery':
                return 'bicycle-outline';
            case 'delivered':
                return 'checkmark-done-circle-outline';
            case 'cancelled':
                return 'close-circle-outline';
            default:
                return 'ellipse-outline';
        }
    };

    if (!isAuthenticated) {
        return (
            <SafeAreaView className="flex-1"style={{ backgroundColor: COLORS.background }}>
                <View className="bg-white px-4 py-4 border-b border-gray-200">
                    <Text className="text-2xl font-bold" style={{ color: COLORS.dark }}>
                        Siparişlerim
                    </Text>
                </View>

                <View className="flex-1 items-center justify-center px-8">
                    <View
                        className="w-32 h-32 rounded-full items-center justify-center mb-6"
                        style={{ backgroundColor: COLORS.primary + '20' }}
                    >
                        <Ionicons name="receipt-outline" size={64} color={COLORS.primary} />
                    </View>
                    <Text className="text-2xl font-bold mb-2 text-center" style={{ color: COLORS.dark }}>
                        Giriş Yapın
                    </Text>
                    <Text className="text-base text-center mb-6" style={{ color: COLORS.gray }}>
                        Siparişlerinizi görmek için giriş yapmanız gerekiyor.
                    </Text>

                    <TouchableOpacity
                        onPress={() => router.push('/(auth)/login')}
                        className="rounded-xl px-8 py-4"
                        style={{ backgroundColor: COLORS.primary }}
                    >
                        <Text className="text-white text-base font-semibold">Giriş Yap</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const renderOrder = ({ item }: { item: Order }) => (
        <TouchableOpacity
            onPress={() => router.push(`/order-tracking/${item.id}`)}
            className="bg-white rounded-3xl p-4 mx-4 mb-4"
            style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
            }}
        >
            {/* Order Header */}
            <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-gray-200">
                <View className="flex-1">
                    <Text className="text-base font-bold mb-1" style={{ color: COLORS.dark }}>
                        {item.order_number}
                    </Text>
                    <Text className="text-sm" style={{ color: COLORS.gray }}>
                        {new Date(item.created_at).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </Text>
                </View>

                <View
                    className="flex-row items-center px-3 py-2 rounded-full"
                    style={{ backgroundColor: getStatusColor(item.status) + '20' }}
                >
                    <Ionicons name={getStatusIcon(item.status) as any} size={16} color={getStatusColor(item.status)} />
                    <Text
                        className="ml-2 text-sm font-semibold"
                        style={{ color: getStatusColor(item.status) }}
                    >
                        {ORDER_STATUS_LABELS[item.status as keyof typeof ORDER_STATUS_LABELS]}
                    </Text>
                </View>
            </View>

            {/* Order Items Preview */}
            <View className="mb-3">
                <Text className="text-sm mb-2" style={{ color: COLORS.gray }}>
                    {item.items.length} ürün
                </Text>
                <View className="flex-row flex-wrap">
                    {item.items.slice(0, 3).map((orderItem, index) => (
                        <Text key={orderItem.id} className="text-sm mr-1" style={{ color: COLORS.dark }}>
                            {orderItem.product.name}
                            {index < Math.min(2, item.items.length - 1) && ','}
                        </Text>
                    ))}
                    {item.items.length > 3 && (
                        <Text className="text-sm" style={{ color: COLORS.gray }}>
                            +{item.items.length - 3} daha
                        </Text>
                    )}
                </View>
            </View>

            {/* Order Footer */}
            <View className="flex-row items-center justify-between">
                <View>
                    <Text className="text-sm mb-1" style={{ color: COLORS.gray }}>
                        Toplam Tutar
                    </Text>
                    <Text className="text-xl font-bold" style={{ color: COLORS.primary }}>
                        ₺{item.total_amount.toFixed(2)}
                    </Text>
                </View>

                <TouchableOpacity
                    className="flex-row items-center px-4 py-2 rounded-xl"
                    style={{ backgroundColor: COLORS.primary }}
                >
                    <Text className="text-white font-semibold mr-2">Detaylar</Text>
                    <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ backgroundColor: COLORS.background }}>
            {/* Header */}
            <View className="bg-white px-4 py-4 border-b border-gray-200">
                <Text className="text-2xl font-bold" style={{ color: COLORS.dark }}>
                    Siparişlerim
                </Text>
            </View>

            {/* Tabs */}
            <View className="bg-white px-4 py-3 flex-row border-b border-gray-200">
                {[
                    { id: 'all', label: 'Tümü' },
                    { id: 'active', label: 'Aktif' },
                    { id: 'completed', label: 'Tamamlanan' },
                ].map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        onPress={() => setSelectedTab(tab.id as any)}
                        className="flex-1 items-center py-2 mx-1 rounded-xl"
                        style={{
                            backgroundColor: selectedTab === tab.id ? COLORS.primary + '20' : 'transparent',
                        }}
                    >
                        <Text
                            className="font-semibold"
                            style={{
                                color: selectedTab === tab.id ? COLORS.primary : COLORS.gray,
                            }}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Orders List */}
            {orders.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    <View
                        className="w-32 h-32 rounded-full items-center justify-center mb-6"
                        style={{ backgroundColor: COLORS.gray + '20' }}
                    >
                        <Ionicons name="receipt-outline" size={64} color={COLORS.gray} />
                    </View>
                    <Text className="text-xl font-bold mb-2 text-center" style={{ color: COLORS.dark }}>
                        Henüz Sipariş Yok
                    </Text>
                    <Text className="text-base text-center mb-6" style={{ color: COLORS.gray }}>
                        {selectedTab === 'all'
                            ? 'Henüz hiç sipariş vermediniz.'
                            : selectedTab === 'active'
                                ? 'Şu anda aktif siparişiniz bulunmuyor.'
                                : 'Tamamlanmış siparişiniz bulunmuyor.'}
                    </Text>

                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)')}
                        className="rounded-xl px-8 py-4"
                        style={{ backgroundColor: COLORS.primary }}
                    >
                        <Text className="text-white text-base font-semibold">Alışverişe Başla</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrder}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingVertical: 16 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                    }
                />
            )}
        </SafeAreaView>
    );
}