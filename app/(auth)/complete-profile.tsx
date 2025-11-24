// app/(auth)/complete-profile.tsx
import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { COLORS } from '@/lib/constants';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CompleteProfileScreen() {
    const router = useRouter();
    const { setUser } = useAuthStore();
    const { showToast } = useToast();
    const [phone, setPhone] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [fullName, setFullName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Get current user data from auth
        const getCurrentUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    // Check if user already exists in database
                    const { data: userData } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', user.id)
                        .single();

                    if (userData) {
                        // Pre-fill existing data
                        setFullName(userData.full_name || '');
                        setPhone(userData.phone ? formatPhoneForDisplay(userData.phone) : '');
                        if (userData.birth_date) {
                            setBirthDate(formatDateForDisplay(userData.birth_date));
                        }
                    } else {
                        // Pre-fill name from auth metadata
                        setFullName(user.user_metadata?.full_name || user.user_metadata?.name || '');
                    }
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        };
        getCurrentUser();
    }, []);

    // Format phone for display (05XX XXX XX XX)
    const formatPhoneForDisplay = (phone: string) => {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length !== 11) return phone;

        return cleaned.substring(0, 4) + ' ' +
            cleaned.substring(4, 7) + ' ' +
            cleaned.substring(7, 9) + ' ' +
            cleaned.substring(9);
    };

    // Format date for display (DD/MM/YYYY)
    const formatDateForDisplay = (date: string) => {
        try {
            const d = new Date(date);
            const day = d.getDate().toString().padStart(2, '0');
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        } catch {
            return '';
        }
    };

    // Phone input mask handler (05XX XXX XX XX)
    const handlePhoneChange = (text: string) => {
        // Remove all non-numeric characters
        const cleaned = text.replace(/\D/g, '');

        // Limit to 11 digits
        const limited = cleaned.substring(0, 11);

        // Apply mask
        let formatted = limited;
        if (limited.length > 3) {
            formatted = limited.substring(0, 4) + ' ' + limited.substring(4);
        }
        if (limited.length > 6) {
            formatted = limited.substring(0, 4) + ' ' + limited.substring(4, 7) + ' ' + limited.substring(7);
        }
        if (limited.length > 9) {
            formatted = limited.substring(0, 4) + ' ' + limited.substring(4, 7) + ' ' + limited.substring(7, 9) + ' ' + limited.substring(9);
        }

        setPhone(formatted);
    };

    // Birth date input mask handler (DD/MM/YYYY)
    const handleBirthDateChange = (text: string) => {
        // Remove all non-numeric characters
        const cleaned = text.replace(/\D/g, '');

        // Limit to 8 digits
        const limited = cleaned.substring(0, 8);

        // Apply mask
        let formatted = limited;
        if (limited.length > 2) {
            formatted = limited.substring(0, 2) + '/' + limited.substring(2);
        }
        if (limited.length > 4) {
            formatted = limited.substring(0, 2) + '/' + limited.substring(2, 4) + '/' + limited.substring(4);
        }

        setBirthDate(formatted);
    };

    // Validate date
    const isValidDate = (day: number, month: number, year: number): boolean => {
        // Check year range
        const currentYear = new Date().getFullYear();
        if (year < 1900 || year > currentYear) return false;

        // Check month
        if (month < 1 || month > 12) return false;

        // Check day
        if (day < 1 || day > 31) return false;

        // Check days in month
        const daysInMonth = new Date(year, month, 0).getDate();
        if (day > daysInMonth) return false;

        // Check if date is not in the future
        const inputDate = new Date(year, month - 1, day);
        if (inputDate > new Date()) return false;

        return true;
    };

    const handleComplete = async () => {
        // Validate all required fields
        if (!fullName.trim()) {
            showToast('Lütfen adınızı girin', 'warning');
            return;
        }

        if (!phone.trim()) {
            showToast('Lütfen telefon numaranızı girin', 'warning');
            return;
        }

        // Validate phone (must be 11 digits)
        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length !== 11) {
            showToast('Telefon numarası 11 haneli olmalıdır', 'warning');
            return;
        }

        // Validate phone starts with 05
        if (!phoneDigits.startsWith('05')) {
            showToast('Telefon numarası 05 ile başlamalıdır', 'warning');
            return;
        }

        if (!birthDate.trim()) {
            showToast('Lütfen doğum tarihinizi girin', 'warning');
            return;
        }

        // Validate birth date (must be DD/MM/YYYY)
        const birthDateDigits = birthDate.replace(/\D/g, '');
        if (birthDateDigits.length !== 8) {
            showToast('Doğum tarihi GG/AA/YYYY formatında olmalıdır', 'warning');
            return;
        }

        // Validate date values
        const day = parseInt(birthDateDigits.substring(0, 2));
        const month = parseInt(birthDateDigits.substring(2, 4));
        const year = parseInt(birthDateDigits.substring(4, 8));

        if (!isValidDate(day, month, year)) {
            showToast('Geçerli bir doğum tarihi girin', 'warning');
            return;
        }

        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('Kullanıcı bulunamadı');
            }

            console.log('Completing profile for user:', user.id);

            // Format birth date for database (YYYY-MM-DD)
            const formattedBirthDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

            console.log('Formatted birth date:', formattedBirthDate);

            // Check if user already exists in users table
            const { data: existingUser, error: checkError } = await supabase
                .from('users')
                .select('id')
                .eq('id', user.id)
                .maybeSingle();

            if (checkError) {
                console.error('Error checking existing user:', checkError);
                throw checkError;
            }

            console.log('Existing user check:', existingUser ? 'exists' : 'does not exist');

            let updateData: any = {
                full_name: fullName.trim(),
                phone: phoneDigits,
                birth_date: formattedBirthDate,
                updated_at: new Date().toISOString(),
            };

            if (existingUser) {
                // Update existing user
                console.log('Updating existing user with data:', updateData);

                const { data: updatedUser, error: updateError } = await supabase
                    .from('users')
                    .update(updateData)
                    .eq('id', user.id)
                    .select()
                    .single();

                if (updateError) {
                    console.error('Update error:', updateError);
                    throw updateError;
                }

                console.log('User updated successfully:', updatedUser);
            } else {
                // Insert new user
                const insertData = {
                    id: user.id,
                    email: user.email!,
                    ...updateData,
                    created_at: new Date().toISOString(),
                };

                console.log('Inserting new user with data:', insertData);

                const { data: newUser, error: insertError } = await supabase
                    .from('users')
                    .insert([insertData])
                    .select()
                    .single();

                if (insertError) {
                    console.error('Insert error:', insertError);
                    throw insertError;
                }

                console.log('User inserted successfully:', newUser);
            }

            // Fetch updated user data
            const { data: userData, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (fetchError) {
                console.error('Fetch error:', fetchError);
                throw fetchError;
            }

            console.log('Final user data:', userData);

            setUser(userData);
            showToast('Profiliniz tamamlandı! Hoş geldiniz!', 'success');

            // Navigate to home with a delay to ensure state is updated
            setTimeout(() => {
                router.replace('/(tabs)');
            }, 500);
        } catch (error: any) {
            console.error('Complete profile error:', error);

            // Provide more specific error messages
            let errorMessage = 'Profil tamamlanamadı';

            if (error.code === 'PGRST204') {
                errorMessage = 'Veritabanı hatası. Lütfen destek ekibiyle iletişime geçin.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            showToast(errorMessage, 'error');
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
            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ flexGrow: 1 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View className="flex-1 px-6 pt-12 pb-8">
                            {/* Header */}
                            <View className="items-center mb-8">
                                <View
                                    className="w-24 h-24 rounded-full items-center justify-center mb-4"
                                    style={{ backgroundColor: COLORS.primary + '20' }}
                                >
                                    <Ionicons name="checkmark-circle" size={56} color={COLORS.primary} />
                                </View>
                                <Text className="text-3xl font-bold mb-2 text-center" style={{ color: COLORS.dark }}>
                                    Hoş Geldiniz!
                                </Text>
                                <Text className="text-base text-center" style={{ color: COLORS.gray }}>
                                    Profilinizi tamamlayın
                                </Text>
                            </View>

                            {/* Full Name Input */}
                            <View className="mb-4">
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className="text-sm" style={{ color: COLORS.gray }}>
                                        Ad Soyad
                                    </Text>
                                    <Text className="text-xs" style={{ color: COLORS.danger }}>
                                        * Zorunlu
                                    </Text>
                                </View>
                                <View className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-gray-200">
                                    <Ionicons name="person-outline" size={20} color={COLORS.gray} />
                                    <TextInput
                                        placeholder="Adınız Soyadınız"
                                        value={fullName}
                                        onChangeText={setFullName}
                                        className="flex-1 ml-3 text-base"
                                        placeholderTextColor={COLORS.gray}
                                        editable={!isLoading}
                                    />
                                </View>
                            </View>

                            {/* Phone Input */}
                            <View className="mb-4">
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className="text-sm" style={{ color: COLORS.gray }}>
                                        Telefon Numarası
                                    </Text>
                                    <Text className="text-xs" style={{ color: COLORS.danger }}>
                                        * Zorunlu
                                    </Text>
                                </View>
                                <View className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-gray-200">
                                    <Ionicons name="call-outline" size={20} color={COLORS.gray} />
                                    <TextInput
                                        placeholder="05XX XXX XX XX"
                                        value={phone}
                                        onChangeText={handlePhoneChange}
                                        keyboardType="phone-pad"
                                        className="flex-1 ml-3 text-base"
                                        placeholderTextColor={COLORS.gray}
                                        maxLength={15} // 11 digits + 3 spaces
                                        editable={!isLoading}
                                    />
                                </View>
                            </View>

                            {/* Birth Date Input */}
                            <View className="mb-8">
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className="text-sm" style={{ color: COLORS.gray }}>
                                        Doğum Tarihi
                                    </Text>
                                    <Text className="text-xs" style={{ color: COLORS.danger }}>
                                        * Zorunlu
                                    </Text>
                                </View>
                                <View className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-gray-200">
                                    <Ionicons name="calendar-outline" size={20} color={COLORS.gray} />
                                    <TextInput
                                        placeholder="GG/AA/YYYY"
                                        value={birthDate}
                                        onChangeText={handleBirthDateChange}
                                        keyboardType="number-pad"
                                        className="flex-1 ml-3 text-base"
                                        placeholderTextColor={COLORS.gray}
                                        maxLength={10} // 8 digits + 2 slashes
                                        editable={!isLoading}
                                    />
                                </View>
                                <Text className="text-xs mt-1 ml-1" style={{ color: COLORS.gray }}>
                                    Örnek: 15/06/1990
                                </Text>
                            </View>

                            {/* Complete Button */}
                            <TouchableOpacity
                                onPress={handleComplete}
                                disabled={isLoading}
                                className="rounded-xl py-4"
                                style={{
                                    backgroundColor: COLORS.primary,
                                    opacity: isLoading ? 0.7 : 1,
                                }}
                                activeOpacity={0.8}
                            >
                                <Text className="text-white text-center text-lg font-semibold">
                                    {isLoading ? 'Tamamlanıyor...' : 'Alışverişe Başla'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}