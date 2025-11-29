import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import { COLORS } from '@/lib/constants';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleResetPassword = async () => {
        if (!email) {
            showToast('Lütfen e-posta adresinizi girin', 'warning');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast('Geçerli bir e-posta adresi girin', 'warning');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'denizmarket://reset-password',
            });

            if (error) throw error;

            setEmailSent(true);
            showToast('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi', 'success');
        } catch (error: any) {
            showToast(error.message || 'Şifre sıfırlama başarısız', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (emailSent) {
        return (
            <LinearGradient
                colors={['#E8F5E9', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ flex: 1 }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                >
                    <View className="flex-1 px-6 justify-center">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 rounded-full items-center justify-center mb-8"
                            style={{ backgroundColor: COLORS.white }}
                        >
                            <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                        </TouchableOpacity>

                        <View className="items-center mb-8">
                            <View
                                className="w-32 h-32 rounded-full items-center justify-center mb-6"
                                style={{ backgroundColor: COLORS.primary + '20' }}
                            >
                                <Ionicons name="mail-open" size={64} color={COLORS.primary} />
                            </View>

                            <Text className="text-3xl font-bold mb-4 text-center" style={{ color: COLORS.dark }}>
                                E-posta Gönderildi!
                            </Text>

                            <Text className="text-base text-center mb-6" style={{ color: COLORS.gray }}>
                                <Text className="font-semibold">{email}</Text> adresine şifre sıfırlama bağlantısı gönderdik.
                            </Text>

                            <Text className="text-sm text-center mb-8" style={{ color: COLORS.gray }}>
                                Lütfen gelen kutunuzu kontrol edin ve şifrenizi sıfırlamak için e-postadaki bağlantıya tıklayın.
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="rounded-xl py-4 mb-4"
                            style={{ backgroundColor: COLORS.primary }}
                        >
                            <Text className="text-white text-center text-lg font-semibold">
                                Giriş Sayfasına Dön
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                setEmailSent(false);
                                setEmail('');
                            }}
                            className="py-3"
                        >
                            <Text className="text-center font-semibold" style={{ color: COLORS.primary }}>
                                Farklı E-posta ile Dene
                            </Text>
                        </TouchableOpacity>

                        {/* Didn't receive email */}
                        <View className="mt-8 bg-blue-50 rounded-2xl p-4 border border-blue-200">
                            <Text className="text-sm text-center mb-2" style={{ color: COLORS.dark }}>
                                E-posta almadınız mı?
                            </Text>
                            <Text className="text-xs text-center" style={{ color: COLORS.gray }}>
                                Spam klasörünü kontrol edin veya birkaç dakika sonra tekrar deneyin.
                            </Text>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={['#E8F5E9', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ flex: 1 }}
        >
            <SafeAreaView className="flex-1"style={{ flex: 1 }}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1 }}
                >
                    <View className="flex-1 px-6 pt-16 pb-8">
                        {/* Back Button */}
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 rounded-full items-center justify-center mb-8"
                            style={{ backgroundColor: COLORS.white }}
                        >
                            <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                        </TouchableOpacity>

                        {/* Header */}
                        <View className="items-center mb-8">
                            <View
                                className="w-32 h-32 rounded-full items-center justify-center mb-6"
                                style={{ backgroundColor: COLORS.primary + '20' }}
                            >
                                <Ionicons name="lock-closed" size={64} color={COLORS.primary} />
                            </View>

                            <Text className="text-3xl font-bold mb-2" style={{ color: COLORS.dark }}>
                                Şifremi Unuttum
                            </Text>
                            <Text className="text-base text-center" style={{ color: COLORS.gray }}>
                                E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
                            </Text>
                        </View>

                        {/* Email Input */}
                        <View className="mb-6">
                            <Text className="text-sm mb-2" style={{ color: COLORS.gray }}>
                                E-posta Adresi
                            </Text>
                            <View className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-gray-200">
                                <Ionicons name="mail-outline" size={20} color={COLORS.gray} />
                                <TextInput
                                    placeholder="ornek@email.com"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    className="flex-1 ml-3 text-base"
                                    placeholderTextColor={COLORS.gray}
                                />
                            </View>
                        </View>

                        {/* Reset Button */}
                        <TouchableOpacity
                            onPress={handleResetPassword}
                            disabled={loading}
                            className="rounded-xl py-4 mb-4"
                            style={{
                                backgroundColor: COLORS.primary,
                                opacity: loading ? 0.7 : 1,
                            }}
                        >
                            <Text className="text-white text-center text-lg font-semibold">
                                {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
                            </Text>
                        </TouchableOpacity>

                        {/* Back to Login */}
                        <View className="flex-row items-center justify-center mt-6">
                            <Text style={{ color: COLORS.gray }}>Şifrenizi hatırladınız mı? </Text>
                            <TouchableOpacity onPress={() => router.back()}>
                                <Text style={{ color: COLORS.primary }} className="font-semibold">
                                    Giriş Yap
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Info Box */}
                        <View className="mt-8 bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
                            <View className="flex-row">
                                <Ionicons name="information-circle" size={24} color={COLORS.warning} />
                                <Text className="flex-1 ml-3 text-sm" style={{ color: COLORS.dark }}>
                                    Şifre sıfırlama bağlantısı 24 saat geçerlidir. E-postayı almadıysanız,
                                    spam klasörünü kontrol etmeyi unutmayın.
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}