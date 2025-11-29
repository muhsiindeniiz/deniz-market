// app/categories.tsx
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Category } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import { CategoryCardSkeleton } from '@/components/ui/Loading';

interface CategoryWithCount extends Category {
    product_count: number;
}

export default function CategoriesScreen() {
    const router = useRouter();
    const [categories, setCategories] = useState<CategoryWithCount[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select(`
                    *,
                    products(count)
                `)
                .order('name');

            if (error) throw error;

            if (data) {
                const categoriesWithCount = data.map((category: any) => ({
                    ...category,
                    product_count: category.products?.[0]?.count || 0
                }));
                setCategories(categoriesWithCount);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderCategory = ({ item }: { item: CategoryWithCount }) => (
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
                    className="w-20 h-20 rounded-2xl items-center justify-center overflow-hidden"
                    style={{ backgroundColor: item.color + '20' }}
                >
                    {item.image_url ? (
                        <Image
                            source={{ uri: item.image_url }}
                            className="w-14 h-14"
                            resizeMode="contain"
                        />
                    ) : (
                        <View
                            className="w-14 h-14 rounded-full"
                            style={{ backgroundColor: item.color + '40' }}
                        />
                    )}
                </View>

                <View className="flex-1 ml-4">
                    <Text className="text-xl font-bold mb-1" style={{ color: COLORS.dark }}>
                        {item.name}
                    </Text>
                    <Text className="text-sm" style={{ color: COLORS.gray }}>
                        {item.product_count} ürün
                    </Text>
                </View>

                <Ionicons name="chevron-forward" size={24} color={COLORS.gray} />
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView className="flex-1"style={{ backgroundColor: COLORS.background }}>
                <View className="bg-white px-4 py-4 border-b border-gray-200 flex-row items-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: COLORS.background }}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                    </TouchableOpacity>
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
        <SafeAreaView className="flex-1"style={{ backgroundColor: COLORS.background }}>
            <View className="bg-white px-4 py-4 border-b border-gray-200 flex-row items-center">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: COLORS.background }}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                </TouchableOpacity>
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