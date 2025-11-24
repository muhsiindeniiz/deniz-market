import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Category } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import { CategoryCardSkeleton } from '@/components/ui/Loading';

export default function CategoriesScreen() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const { data } = await supabase
                .from('categories')
                .select('*')
                .order('name');

            if (data) setCategories(data);
        } catch (error) {
            console.error('Error loading categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderCategory = ({ item }: { item: Category }) => (
        <TouchableOpacity
            onPress={() => router.push(`/category/${item.id}`)}
            className="bg-white rounded-3xl p-6 mb-4 mx-4"
            style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
            }}
        >
            <View className="flex-row items-center">
                <View
                    className="w-20 h-20 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: item.color + '20' }}
                >
                    <Ionicons name={item.icon as any} size={40} color={item.color} />
                </View>

                <View className="flex-1 ml-4">
                    <Text className="text-xl font-bold mb-1" style={{ color: COLORS.dark }}>
                        {item.name}
                    </Text>
                    <Text className="text-sm" style={{ color: COLORS.gray }}>
                        {item.item_count} ürün
                    </Text>
                </View>

                <Ionicons name="chevron-forward" size={24} color={COLORS.gray} />
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.background }}>
                <View className="bg-white px-4 py-4 border-b border-gray-200">
                    <Text className="text-2xl font-bold" style={{ color: COLORS.dark }}>
                        Kategoriler
                    </Text>
                </View>
                <ScrollView className="pt-4">
                    {[1, 2, 3, 4, 5].map((item) => (
                        <CategoryCardSkeleton key={item} />
                    ))}
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.background }}>
            {/* Header */}
            <View className="bg-white px-4 py-4 border-b border-gray-200">
                <Text className="text-2xl font-bold" style={{ color: COLORS.dark }}>
                    Kategoriler
                </Text>
            </View>

            <FlatList
                data={categories}
                renderItem={renderCategory}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingVertical: 16 }}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}