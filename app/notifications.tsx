import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Notification } from '@/lib/types';
import { COLORS } from '@/lib/constants';

export default function NotificationsScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (data) setNotifications(data);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            setNotifications(
                notifications.map((notif) =>
                    notif.id === notificationId ? { ...notif, is_read: true } : notif
                )
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user?.id);

            setNotifications(
                notifications.map((notif) => ({ ...notif, is_read: true }))
            );
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'order':
                return 'receipt-outline';
            case 'promotion':
                return 'pricetag-outline';
            default:
                return 'notifications-outline';
        }
    };

    const renderNotification = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            onPress={() => {
                markAsRead(item.id);
                if (item.type === 'order' && item.data?.order_id) {
                    router.push(`/order-tracking/${item.data.order_id}`);
                }
            }}
            className="bg-white rounded-2xl p-4 mx-4 mb-3"
            style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
                opacity: item.is_read ? 0.7 : 1,
            }}
        >
            <View className="flex-row">
                <View
                    className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                    style={{
                        backgroundColor:
                            item.type === 'order'
                                ? COLORS.primary + '20'
                                : item.type === 'promotion'
                                    ? COLORS.warning + '20'
                                    : COLORS.info + '20',
                    }}
                >
                    <Ionicons
                        name={getNotificationIcon(item.type) as any}
                        size={24}
                        color={
                            item.type === 'order'
                                ? COLORS.primary
                                : item.type === 'promotion'
                                    ? COLORS.warning
                                    : COLORS.info
                        }
                    />
                </View>

                <View className="flex-1">
                    <View className="flex-row items-start justify-between mb-1">
                        <Text
                            className="flex-1 text-base font-semibold mr-2"
                            style={{ color: COLORS.dark }}
                        >
                            {item.title}
                        </Text>
                        {!item.is_read && (
                            <View
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: COLORS.primary }}
                            />
                        )}
                    </View>

                    <Text className="text-sm mb-2" style={{ color: COLORS.gray }}>
                        {item.message}
                    </Text>

                    <Text className="text-xs" style={{ color: COLORS.gray }}>
                        {new Date(item.created_at).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.background }}>
            {/* Header */}
            <View className="bg-white px-4 py-4 flex-row items-center justify-between border-b border-gray-200">
                <View className="flex-row items-center flex-1">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold" style={{ color: COLORS.dark }}>
                        Bildirimler
                    </Text>
                </View>

                {notifications.some((n) => !n.is_read) && (
                    <TouchableOpacity onPress={markAllAsRead}>
                        <Text style={{ color: COLORS.primary }} className="font-semibold">
                            Tümünü Okundu İşaretle
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {notifications.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    <View
                        className="w-32 h-32 rounded-full items-center justify-center mb-6"
                        style={{ backgroundColor: COLORS.gray + '20' }}
                    >
                        <Ionicons name="notifications-outline" size={64} color={COLORS.gray} />
                    </View>
                    <Text className="text-2xl font-bold mb-2 text-center" style={{ color: COLORS.dark }}>
                        Bildirim Yok
                    </Text>
                    <Text className="text-base text-center" style={{ color: COLORS.gray }}>
                        Henüz hiç bildiriminiz bulunmuyor.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderNotification}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingVertical: 16 }}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}