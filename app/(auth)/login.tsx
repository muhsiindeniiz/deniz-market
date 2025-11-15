import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { COLORS } from '@/lib/constants';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
    const router = useRouter();
    const { setUser } = useAuthStore();
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            showToast('Lütfen tüm alanları doldurun', 'warning');
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                setUser(userData);
                showToast('Giriş başarılı!', 'success');
                router.replace('/(tabs)');
            }
        } catch (error: any) {
            showToast(error.message || 'Giriş yapılamadı', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });

            if (error) throw error;
            showToast('Google ile giriş başarılı!', 'success');
        } catch (error: any) {
            showToast(error.message || 'Google girişi yapılamadı', 'error');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
        >
            <LinearGradient
                colors={['#E8F5E9', '#FFFFFF']}
                className="flex-1"
            >
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    <View className="flex-1 px-6 pt-20 pb-8">
                        {/* Logo */}
                        <View className="items-center mb-8">
                            <View className="w-32 h-32 rounded-full items-center justify-center mb-6" style={{ backgroundColor: COLORS.primary + '20' }}>
                                <Ionicons name="key" size={64} color={COLORS.primary} />
                            </View>
                            <Text className="text-3xl font-bold mb-2" style={{ color: COLORS.dark }}>
                                Hesabınıza giriş yapın
                            </Text>
                            <Text className="text-base text-center" style={{ color: COLORS.gray }}>
                                Tekrar hoş geldiniz! Lütfen bilgilerinizi girin.
                            </Text>
                        </View>

                        {/* Email Input */}
                        <View className="mb-4">
                            <Text className="text-sm mb-2" style={{ color: COLORS.gray }}>
                                E-posta Adresi
                            </Text>
                            <View className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-gray-200">
                                <TextInput
                                    placeholder="ornek@email.com"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    className="flex-1 text-base"
                                    placeholderTextColor={COLORS.gray}
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View className="mb-4">
                            <Text className="text-sm mb-2" style={{ color: COLORS.gray }}>
                                Şifre
                            </Text>
                            <View className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-gray-200">
                                <TextInput
                                    placeholder="••••••••••••••••••••"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    className="flex-1 text-base"
                                    placeholderTextColor={COLORS.gray}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? 'eye-off' : 'eye'}
                                        size={24}
                                        color={COLORS.gray}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Remember Me & Forgot Password */}
                        <View className="flex-row items-center justify-between mb-6">
                            <TouchableOpacity
                                onPress={() => setRememberMe(!rememberMe)}
                                className="flex-row items-center"
                            >
                                <View
                                    className="w-6 h-6 rounded border-2 items-center justify-center mr-2"
                                    style={{ borderColor: rememberMe ? COLORS.primary : COLORS.gray }}
                                >
                                    {rememberMe && (
                                        <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                                    )}
                                </View>
                                <Text style={{ color: COLORS.dark }}>Beni hatırla</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                                <Text style={{ color: COLORS.primary }} className="font-medium">
                                    Şifremi unuttum
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={isLoading}
                            className="rounded-xl py-4 mb-4"
                            style={{ backgroundColor: COLORS.primary }}
                        >
                            <Text className="text-white text-center text-lg font-semibold">
                                {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                            </Text>
                        </TouchableOpacity>

                        {/* Google Login */}
                        <TouchableOpacity
                            onPress={handleGoogleLogin}
                            className="flex-row items-center justify-center bg-white rounded-xl py-4 border border-gray-200"
                        >
                            <Ionicons name="logo-google" size={24} color={COLORS.dark} />
                            <Text className="text-base font-medium ml-3" style={{ color: COLORS.dark }}>
                                Google ile giriş yap
                            </Text>
                        </TouchableOpacity>

                        {/* Sign Up Link */}
                        <View className="flex-row items-center justify-center mt-6">
                            <Text style={{ color: COLORS.gray }}>Hesabınız yok mu? </Text>
                            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                                <Text style={{ color: COLORS.primary }} className="font-semibold">
                                    Kayıt Ol
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}