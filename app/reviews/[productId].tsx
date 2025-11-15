import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { Review } from '@/lib/types';
import { COLORS } from '@/lib/constants';

export default function ReviewsScreen() {
    const router = useRouter();
    const { productId } = useLocalSearchParams();
    const { user } = useAuthStore();
    const { showToast } = useToast();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadReviews();
    }, [productId]);

    const loadReviews = async () => {
        try {
            const { data } = await supabase
                .from('reviews')
                .select('*, user:users(*)')
                .eq('product_id', productId)
                .order('created_at', { ascending: false });

            if (data) setReviews(data);
        } catch (error) {
            console.error('Error loading reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!comment.trim()) {
            showToast('Lütfen bir yorum yazın', 'warning');
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase.from('reviews').insert([
                {
                    product_id: productId,
                    user_id: user?.id,
                    rating,
                    comment: comment.trim(),
                },
            ]);

            if (error) throw error;

            showToast('Değerlendirmeniz kaydedildi', 'success');
            setComment('');
            setRating(5);
            loadReviews();
        } catch (error: any) {
            showToast(error.message || 'Değerlendirme eklenemedi', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const renderReview = ({ item }: { item: Review }) => (
        <View className="bg-white rounded-2xl p-4 mx-4 mb-3">
            <View className="flex-row items-center mb-3">
                <View
                    className="w-12 h-12 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: COLORS.primary + '20' }}
                >
                    <Text className="text-lg font-bold" style={{ color: COLORS.primary }}>
                        {item.user?.full_name?.charAt(0).toUpperCase()}
                    </Text>
                </View>

                <View className="flex-1">
                    <Text className="text-base font-semibold mb-1" style={{ color: COLORS.dark }}>
                        {item.user?.full_name}
                    </Text>
                    <View className="flex-row">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons
                                key={star}
                                name={star <= item.rating ? 'star' : 'star-outline'}
                                size={14}
                                color={COLORS.warning}
                            />
                        ))}
                    </View>
                </View>

                <Text className="text-xs" style={{ color: COLORS.gray }}>
                    {new Date(item.created_at).toLocaleDateString('tr-TR')}
                </Text>
            </View>

            <Text className="text-sm leading-6" style={{ color: COLORS.gray }}>
                {item.comment}
            </Text>
        </View>
    );

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.background }}>
            {/* Header */}
            <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                </TouchableOpacity>
                <Text className="text-xl font-bold flex-1" style={{ color: COLORS.dark }}>
                    Değerlendirmeler
                </Text>
            </View>

            <View className="flex-1">
                {/* Write Review */}
                <View className="bg-white p-4 mb-2">
                    <Text className="text-lg font-bold mb-3" style={{ color: COLORS.dark }}>
                        Değerlendirme Yap
                    </Text>

                    <View className="flex-row items-center justify-center mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => setRating(star)} className="mx-1">
                                <Ionicons
                                    name={star <= rating ? 'star' : 'star-outline'}
                                    size={36}
                                    color={COLORS.warning}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TextInput
                        placeholder="Yorumunuzu yazın..."
                        value={comment}
                        onChangeText={setComment}
                        multiline
                        numberOfLines={4}
                        className="bg-gray-100 rounded-xl px-4 py-3 text-base mb-3"
                        placeholderTextColor={COLORS.gray}
                        textAlignVertical="top"
                    />

                    <TouchableOpacity
                        onPress={handleSubmitReview}
                        disabled={submitting}
                        className="rounded-xl py-3"
                        style={{
                            backgroundColor: COLORS.primary,
                            opacity: submitting ? 0.7 : 1,
                        }}
                    >
                        <Text className="text-white text-center font-semibold">
                            {submitting ? 'Gönderiliyor...' : 'Değerlendirmeyi Gönder'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Reviews List */}
                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : reviews.length === 0 ? (
                    <View className="flex-1 items-center justify-center px-8">
                        <Ionicons name="chatbubbles-outline" size={64} color={COLORS.gray} />
                        <Text className="text-xl font-bold mt-4 mb-2 text-center" style={{ color: COLORS.dark }}>
                            Henüz Değerlendirme Yok
                        </Text>
                        <Text className="text-base text-center" style={{ color: COLORS.gray }}>
                            Bu ürün için ilk değerlendirmeyi siz yapın!
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={reviews}
                        renderItem={renderReview}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingVertical: 8 }}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}