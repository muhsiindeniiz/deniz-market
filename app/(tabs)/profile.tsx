import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { COLORS } from '@/lib/constants';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, isAuthenticated, signOut } = useAuthStore();

    const handleSignOut = () => {
        Alert.alert('Çıkış Yap', 'Çıkış yapmak istediğinize emin misiniz?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Çıkış Yap',
                style: 'destructive',
                onPress: async () => {
                    await signOut();
                    router.replace('/(auth)/login');
                },
            },
        ]);
    };

    if (!isAuthenticated) {
        return (
            <SafeAreaView style={{ backgroundColor: COLORS.background }}>
                <View className="bg-white px-4 py-4 border-b border-gray-200">
                    <Text className="text-2xl font-bold" style={{ color: COLORS.dark }}>
                        Profilim
                    </Text>
                </View>

                <View className="flex-1 items-center justify-center px-8">
                    <View
                        className="w-32 h-32 rounded-full items-center justify-center mb-6"
                        style={{ backgroundColor: COLORS.primary + '20' }}
                    >
                        <Ionicons name="person-outline" size={64} color={COLORS.primary} />
                    </View>
                    <Text className="text-2xl font-bold mb-2 text-center" style={{ color: COLORS.dark }}>
                        Giriş Yapın
                    </Text>
                    <Text className="text-base text-center mb-6" style={{ color: COLORS.gray }}>
                        Profilinizi görüntülemek ve siparişlerinizi takip etmek için giriş yapın.
                    </Text>

                    <TouchableOpacity
                        onPress={() => router.push('/(auth)/login')}
                        className="rounded-xl px-8 py-4 mb-3"
                        style={{ backgroundColor: COLORS.primary }}
                        activeOpacity={0.8}
                    >
                        <Text className="text-white text-base font-semibold">Giriş Yap</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/(auth)/register')}
                        activeOpacity={0.8}
                    >
                        <Text style={{ color: COLORS.primary }} className="font-semibold">
                            Hesap Oluştur
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const menuItems = [
        {
            section: 'Siparişler',
            items: [
                { icon: 'receipt-outline', label: 'Siparişlerim', route: '/orders' },
            ],
        },
        {
            section: 'Hesap',
            items: [
                { icon: 'person-outline', label: 'Profili Düzenle', route: '/edit-profile' },
                { icon: 'mail-outline', label: 'E-posta Değiştir', route: '/edit-email' },
                { icon: 'location-outline', label: 'Adreslerim', route: '/addresses' },
            ],
        },
        {
            section: 'Bildirimler',
            items: [
                { icon: 'notifications-outline', label: 'Bildirimler', route: '/notifications' },
            ],
        },
        {
            section: 'Destek',
            items: [
                { icon: 'help-circle-outline', label: 'Yardım / SSS', route: '/help' },
                { icon: 'mail-outline', label: 'Bize Ulaşın', route: '/contact' },
            ],
        },
        {
            section: 'Hukuki',
            items: [
                { icon: 'document-text-outline', label: 'Kullanım Koşulları', route: '/terms' },
                { icon: 'shield-checkmark-outline', label: 'Gizlilik Politikası', route: '/privacy' },
            ],
        },
    ];

    return (
        <SafeAreaView style={{ backgroundColor: COLORS.background }}>
            {/* Header */}
            <View className="bg-white px-4 py-4 border-b border-gray-200">
                <Text className="text-2xl font-bold" style={{ color: COLORS.dark }}>
                    Profilim
                </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <View className="bg-white mx-4 mt-4 rounded-3xl p-6">
                    <View className="flex-row items-center">
                        <View
                            className="w-20 h-20 rounded-full items-center justify-center mr-4"
                            style={{ backgroundColor: COLORS.primary + '20' }}
                        >
                            <Text className="text-3xl font-bold" style={{ color: COLORS.primary }}>
                                {user?.full_name?.charAt(0).toUpperCase()}
                            </Text>
                        </View>

                        <View className="flex-1">
                            <Text className="text-xl font-bold mb-1" style={{ color: COLORS.dark }}>
                                {user?.full_name}
                            </Text>
                            <Text className="text-sm mb-1" style={{ color: COLORS.gray }}>
                                {user?.email}
                            </Text>
                            <Text className="text-sm" style={{ color: COLORS.gray }}>
                                {user?.phone}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Menu Items */}
                {menuItems.map((section, sectionIndex) => (
                    <View key={sectionIndex} className="mt-4">
                        <Text className="px-6 mb-2 text-sm font-semibold" style={{ color: COLORS.gray }}>
                            {section.section}
                        </Text>

                        <View className="bg-white mx-4 rounded-3xl overflow-hidden">
                            {section.items.map((item, itemIndex) => (
                                <TouchableOpacity
                                    key={itemIndex}
                                    onPress={() => router.push(item.route as any)}
                                    className="flex-row items-center justify-between px-6 py-4"
                                    style={{
                                        borderBottomWidth: itemIndex < section.items.length - 1 ? 1 : 0,
                                        borderBottomColor: '#F0F0F0',
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View className="flex-row items-center flex-1">
                                        <Ionicons name={item.icon as any} size={24} color={COLORS.dark} />
                                        <Text className="ml-4 text-base" style={{ color: COLORS.dark }}>
                                            {item.label}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}

                {/* Sign Out Button */}
                <View className="mx-4 mt-6 mb-8">
                    <TouchableOpacity
                        onPress={handleSignOut}
                        className="bg-white rounded-3xl py-4 flex-row items-center justify-center"
                        activeOpacity={0.7}
                    >
                        <Ionicons name="log-out-outline" size={24} color={COLORS.danger} />
                        <Text className="ml-3 text-base font-semibold" style={{ color: COLORS.danger }}>
                            Çıkış Yap
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* App Version */}
                <View className="items-center mb-6">
                    <Text className="text-sm" style={{ color: COLORS.gray }}>
                        Deniz Market v1.0.0
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}