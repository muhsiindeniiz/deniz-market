import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { PrivacyPolicy } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import Markdown from 'react-native-markdown-display';

export default function PrivacyScreen() {
    const router = useRouter();
    const [privacy, setPrivacy] = useState<PrivacyPolicy | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPrivacy();
    }, []);

    const loadPrivacy = async () => {
        try {
            const { data } = await supabase
                .from('privacy_policies')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (data) setPrivacy(data);
        } catch (error) {
            console.error('Error loading privacy:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1"style={{ backgroundColor: COLORS.background }}>
                <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-200">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold" style={{ color: COLORS.dark }}>
                        Gizlilik Politikası
                    </Text>
                </View>
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1"style={{ backgroundColor: COLORS.background }}>
            {/* Header */}
            <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                </TouchableOpacity>
                <Text className="text-xl font-bold" style={{ color: COLORS.dark }}>
                    Gizlilik Politikası
                </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                <View className="bg-white mx-4 my-4 rounded-3xl p-6">
                    {privacy ? (
                        <Markdown
                            style={{
                                body: { color: COLORS.dark },
                                heading1: { fontSize: 24, fontWeight: 'bold', color: COLORS.dark, marginBottom: 16 },
                                heading2: { fontSize: 20, fontWeight: 'bold', color: COLORS.dark, marginBottom: 12, marginTop: 16 },
                                paragraph: { fontSize: 16, color: COLORS.gray, lineHeight: 24, marginBottom: 12 },
                            }}
                        >
                            {privacy.content}
                        </Markdown>
                    ) : (
                        <Text style={{ color: COLORS.gray }}>İçerik yüklenemedi</Text>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}