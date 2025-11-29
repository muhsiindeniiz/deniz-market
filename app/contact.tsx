import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { COLORS } from '@/lib/constants';

export default function ContactScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { showToast } = useToast();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!subject || !message) {
            showToast('Lütfen tüm alanları doldurun', 'warning');
            return;
        }

        setLoading(true);
        try {
            // Send contact form to backend
            // Implement your logic here

            showToast('Mesajınız başarıyla gönderildi', 'success');
            router.back();
        } catch (error) {
            showToast('Mesaj gönderilemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    const contactMethods = [
        {
            icon: 'call',
            label: 'Telefon',
            value: '+90 555 123 4567',
            action: () => Linking.openURL('tel:+905551234567'),
            color: COLORS.primary,
        },
        {
            icon: 'mail',
            label: 'E-posta',
            value: 'destek@denizmarket.com',
            action: () => Linking.openURL('mailto:destek@denizmarket.com'),
            color: COLORS.info,
        },
        {
            icon: 'logo-whatsapp',
            label: 'WhatsApp',
            value: '+90 555 123 4567',
            action: () => Linking.openURL('https://wa.me/905551234567'),
            color: '#25D366',
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
                    Bize Ulaşın
                </Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Contact Methods */}
                    <View className="px-4 py-4">
                        <Text className="text-base font-semibold mb-3" style={{ color: COLORS.dark }}>
                            İletişim Yöntemleri
                        </Text>

                        {contactMethods.map((method, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={method.action}
                                className="bg-white rounded-2xl p-4 mb-3 flex-row items-center"
                                style={{
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 4,
                                    elevation: 2,
                                }}
                            >
                                <View
                                    className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                                    style={{ backgroundColor: method.color + '20' }}
                                >
                                    <Ionicons name={method.icon as any} size={24} color={method.color} />
                                </View>

                                <View className="flex-1">
                                    <Text className="text-sm mb-1" style={{ color: COLORS.gray }}>
                                        {method.label}
                                    </Text>
                                    <Text className="text-base font-semibold" style={{ color: COLORS.dark }}>
                                        {method.value}
                                    </Text>
                                </View>

                                <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Contact Form */}
                    <View className="px-4 py-4">
                        <Text className="text-base font-semibold mb-3" style={{ color: COLORS.dark }}>
                            Mesaj Gönderin
                        </Text>

                        <View className="bg-white rounded-2xl p-4">
                            {/* Name (Read Only) */}
                            <View className="mb-4">
                                <Text className="text-sm font-semibold mb-2" style={{ color: COLORS.dark }}>
                                    Ad Soyad
                                </Text>
                                <View className="bg-gray-100 rounded-xl px-4 py-3">
                                    <Text className="text-base" style={{ color: COLORS.gray }}>
                                        {user?.full_name || 'Misafir'}
                                    </Text>
                                </View>
                            </View>

                            {/* Email (Read Only) */}
                            <View className="mb-4">
                                <Text className="text-sm font-semibold mb-2" style={{ color: COLORS.dark }}>
                                    E-posta
                                </Text>
                                <View className="bg-gray-100 rounded-xl px-4 py-3">
                                    <Text className="text-base" style={{ color: COLORS.gray }}>
                                        {user?.email || '-'}
                                    </Text>
                                </View>
                            </View>

                            {/* Subject */}
                            <View className="mb-4">
                                <Text className="text-sm font-semibold mb-2" style={{ color: COLORS.dark }}>
                                    Konu
                                </Text>
                                <TextInput
                                    placeholder="Mesaj konusu"
                                    value={subject}
                                    onChangeText={setSubject}
                                    className="bg-gray-100 rounded-xl px-4 py-3 text-base"
                                    placeholderTextColor={COLORS.gray}
                                />
                            </View>

                            {/* Message */}
                            <View className="mb-4">
                                <Text className="text-sm font-semibold mb-2" style={{ color: COLORS.dark }}>
                                    Mesajınız
                                </Text>
                                <TextInput
                                    placeholder="Mesajınızı buraya yazın..."
                                    value={message}
                                    onChangeText={setMessage}
                                    className="bg-gray-100 rounded-xl px-4 py-3 text-base"
                                    placeholderTextColor={COLORS.gray}
                                    multiline
                                    numberOfLines={6}
                                    textAlignVertical="top"
                                />
                            </View>

                            {/* Submit Button */}
                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={loading}
                                className="rounded-xl py-4"
                                style={{
                                    backgroundColor: COLORS.primary,
                                    opacity: loading ? 0.7 : 1,
                                }}
                            >
                                <Text className="text-white text-center text-base font-semibold">
                                    {loading ? 'Gönderiliyor...' : 'Mesajı Gönder'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Working Hours */}
                    <View className="mx-4 mb-6 bg-blue-50 rounded-2xl p-4 border border-blue-200">
                        <View className="flex-row items-start">
                            <Ionicons name="time" size={24} color={COLORS.info} />
                            <View className="flex-1 ml-3">
                                <Text className="text-base font-semibold mb-2" style={{ color: COLORS.dark }}>
                                    Çalışma Saatleri
                                </Text>
                                <Text className="text-sm" style={{ color: COLORS.gray }}>
                                    Pazartesi - Pazar: 08:00 - 23:00
                                </Text>
                                <Text className="text-sm" style={{ color: COLORS.gray }}>
                                    Müşteri hizmetlerimiz 7/24 hizmetinizdedir.
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}