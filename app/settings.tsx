import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { COLORS } from '@/lib/constants';

export default function SettingsScreen() {
    const router = useRouter();
    const [pushNotifications, setPushNotifications] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [orderUpdates, setOrderUpdates] = useState(true);
    const [promotions, setPromotions] = useState(true);

    const settingsSections = [
        {
            title: 'Bildirim Ayarları',
            items: [
                {
                    label: 'Push Bildirimleri',
                    value: pushNotifications,
                    onValueChange: setPushNotifications,
                    type: 'switch',
                },
                {
                    label: 'E-posta Bildirimleri',
                    value: emailNotifications,
                    onValueChange: setEmailNotifications,
                    type: 'switch',
                },
                {
                    label: 'Sipariş Güncellemeleri',
                    value: orderUpdates,
                    onValueChange: setOrderUpdates,
                    type: 'switch',
                },
                {
                    label: 'Kampanya ve Promosyonlar',
                    value: promotions,
                    onValueChange: setPromotions,
                    type: 'switch',
                },
            ],
        },
        {
            title: 'Uygulama',
            items: [
                {
                    label: 'Dil',
                    value: 'Türkçe',
                    icon: 'language-outline',
                    route: '/language',
                    type: 'link',
                },
                {
                    label: 'Önbelleği Temizle',
                    icon: 'trash-outline',
                    type: 'button',
                    action: () => {
                        // Clear cache logic
                    },
                },
            ],
        },
        {
            title: 'Destek',
            items: [
                {
                    label: 'Yardım / SSS',
                    icon: 'help-circle-outline',
                    route: '/help',
                    type: 'link',
                },
                {
                    label: 'Bize Ulaşın',
                    icon: 'mail-outline',
                    route: '/contact',
                    type: 'link',
                },
                {
                    label: 'Değerlendirin',
                    icon: 'star-outline',
                    type: 'button',
                    action: () => {
                        // Open app store
                    },
                },
            ],
        },
        {
            title: 'Hukuki',
            items: [
                {
                    label: 'Kullanım Koşulları',
                    icon: 'document-text-outline',
                    route: '/terms',
                    type: 'link',
                },
                {
                    label: 'Gizlilik Politikası',
                    icon: 'shield-checkmark-outline',
                    route: '/privacy',
                    type: 'link',
                },
            ],
        },
    ];

    return (
        <SafeAreaView className="flex-1"style={{ backgroundColor: COLORS.background }}>
            {/* Header */}
            <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                </TouchableOpacity>
                <Text className="text-xl font-bold" style={{ color: COLORS.dark }}>
                    Ayarlar
                </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {settingsSections.map((section, sectionIndex) => (
                    <View key={sectionIndex} className="mt-6">
                        <Text className="px-6 mb-3 text-sm font-semibold" style={{ color: COLORS.gray }}>
                            {section.title}
                        </Text>

                        <View className="bg-white mx-4 rounded-3xl overflow-hidden">
                            {section.items.map((item, itemIndex) => (
                                <View
                                    key={itemIndex}
                                    style={{
                                        borderBottomWidth: itemIndex < section.items.length - 1 ? 1 : 0,
                                        borderBottomColor: '#F0F0F0',
                                    }}
                                >
                                    {item.type === 'switch' ? (
                                        <View className="flex-row items-center justify-between px-6 py-4">
                                            <Text className="text-base flex-1" style={{ color: COLORS.dark }}>
                                                {item.label}
                                            </Text>
                                            <Switch
                                                value={item.value}
                                                onValueChange={item.onValueChange}
                                                trackColor={{ false: COLORS.gray + '40', true: COLORS.primary + '60' }}
                                                thumbColor={item.value ? COLORS.primary : COLORS.white}
                                            />
                                        </View>
                                    ) : item.type === 'link' ? (
                                        <TouchableOpacity
                                            onPress={() => router.push(item.route as any)}
                                            className="flex-row items-center justify-between px-6 py-4"
                                        >
                                            <View className="flex-row items-center flex-1">
                                                {item.icon && (
                                                    <Ionicons name={item.icon as any} size={24} color={COLORS.dark} />
                                                )}
                                                <Text
                                                    className={`text-base ${item.icon ? 'ml-4' : ''}`}
                                                    style={{ color: COLORS.dark }}
                                                >
                                                    {item.label}
                                                </Text>
                                            </View>
                                            {item.value ? (
                                                <View className="flex-row items-center">
                                                    <Text className="mr-2" style={{ color: COLORS.gray }}>
                                                        {item.value}
                                                    </Text>
                                                    <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                                                </View>
                                            ) : (
                                                <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                                            )}
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity
                                            onPress={item.action}
                                            className="flex-row items-center px-6 py-4"
                                        >
                                            {item.icon && (
                                                <Ionicons name={item.icon as any} size={24} color={COLORS.dark} />
                                            )}
                                            <Text
                                                className={`text-base ${item.icon ? 'ml-4' : ''}`}
                                                style={{ color: COLORS.dark }}
                                            >
                                                {item.label}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                ))}

                <View className="items-center py-8">
                    <Text className="text-sm" style={{ color: COLORS.gray }}>
                        Deniz Market v1.0.0
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}