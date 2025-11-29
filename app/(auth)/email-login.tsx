// app/(auth)/email-login.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { COLORS } from '@/lib/constants';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EmailLoginScreen() {
    const router = useRouter();
    const { setUser } = useAuthStore();
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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

    return (
        <LinearGradient
            colors={['#E8F5E9', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ flex: 1 }}
        >
            <SafeAreaView className="flex-1"style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ flexGrow: 1 }}
                    >
                        <View className="flex-1 px-6 pt-8 pb-8">
                            {/* Back Button */}
                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="w-10 h-10 rounded-full items-center justify-center mb-8"
                                style={{ backgroundColor: COLORS.white }}
                            >
                                <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                            </TouchableOpacity>

                            {/* Header */}
                            <View className="mb-8">
                                <Text className="text-3xl font-bold mb-2" style={{ color: COLORS.dark }}>
                                    E-posta ile Giriş
                                </Text>
                                <Text className="text-base" style={{ color: COLORS.gray }}>
                                    Hesabınıza giriş yapmak için e-posta ve şifrenizi girin
                                </Text>
                            </View>

                            {/* Email Input */}
                            <View className="mb-4">
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

                            {/* Password Input */}
                            <View className="mb-4">
                                <Text className="text-sm mb-2" style={{ color: COLORS.gray }}>
                                    Şifre
                                </Text>
                                <View className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-gray-200">
                                    <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray} />
                                    <TextInput
                                        placeholder="••••••••"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        className="flex-1 ml-3 text-base"
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

                            {/* Forgot Password */}
                            <TouchableOpacity
                                onPress={() => router.push('/(auth)/forgot-password')}
                                className="items-end mb-6"
                            >
                                <Text style={{ color: COLORS.primary }} className="font-medium">
                                    Şifremi unuttum
                                </Text>
                            </TouchableOpacity>

                            {/* Login Button */}
                            <TouchableOpacity
                                onPress={handleLogin}
                                disabled={isLoading}
                                className="rounded-xl py-4 mb-4"
                                style={{
                                    backgroundColor: COLORS.primary,
                                    opacity: isLoading ? 0.7 : 1,
                                }}
                            >
                                <Text className="text-white text-center text-lg font-semibold">
                                    {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                                </Text>
                            </TouchableOpacity>

                            {/* Sign Up Link */}
                            <View className="flex-row items-center justify-center mt-4">
                                <Text style={{ color: COLORS.gray }}>Hesabınız yok mu? </Text>
                                <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                                    <Text style={{ color: COLORS.primary }} className="font-semibold">
                                        Kayıt Ol
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}