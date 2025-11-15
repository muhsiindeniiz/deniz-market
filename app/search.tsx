import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/types';
import { COLORS } from '@/lib/constants';

export default function SearchScreen() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadRecentSearches();
    }, []);

    useEffect(() => {
        if (searchQuery.length > 2) {
            const delayDebounceFn = setTimeout(() => {
                handleSearch();
            }, 500);

            return () => clearTimeout(delayDebounceFn);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const loadRecentSearches = async () => {
        // Load from AsyncStorage or state management
        // For now, using dummy data
        setRecentSearches(['Domates', 'Salatalık', 'Muz', 'Süt']);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        try {
            const { data } = await supabase
                .from('products')
                .select('*, category:categories(*)')
                .ilike('name', `%${searchQuery}%`)
                .limit(20);

            if (data) setSearchResults(data);
        } catch (error) {
            console.error('Error searching:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderProduct = ({ item }: { item: Product }) => {
        const price = item.discount_price || item.price;

        return (
            <TouchableOpacity
                onPress={() => router.push(`/product/${item.id}`)}
                className="bg-white rounded-2xl p-3 mb-3 flex-row"
            >
                <Image
                    source={{ uri: item.images[0] }}
                    className="w-20 h-20 rounded-xl"
                    resizeMode="cover"
                />

                <View className="flex-1 ml-3">
                    <Text className="text-base font-semibold mb-1" style={{ color: COLORS.dark }} numberOfLines={2}>
                        {item.name}
                    </Text>

                    <View className="flex-row items-center mb-2">
                        <Ionicons name="star" size={14} color={COLORS.warning} />
                        <Text className="text-xs ml-1" style={{ color: COLORS.gray }}>
                            {item.rating.toFixed(1)}
                        </Text>
                    </View>

                    <View className="flex-row items-center">
                        <Text className="text-lg font-bold mr-2" style={{ color: COLORS.primary }}>
                            ₺{price.toFixed(2)}
                        </Text>
                        {item.discount_price && (
                            <Text className="text-sm line-through" style={{ color: COLORS.gray }}>
                                ₺{item.price.toFixed(2)}
                            </Text>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.background }}>
            {/* Header */}
            <View className="bg-white px-4 py-3 flex-row items-center border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                </TouchableOpacity>

                <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-4 py-2">
                    <Ionicons name="search" size={20} color={COLORS.gray} />
                    <TextInput
                        placeholder="Ürün ara..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
                        className="flex-1 ml-2 text-base"
                        placeholderTextColor={COLORS.gray}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={COLORS.gray} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {searchQuery.length === 0 ? (
                <View className="flex-1 px-4 py-4">
                    <Text className="text-lg font-bold mb-4" style={{ color: COLORS.dark }}>
                        Son Aramalar
                    </Text>

                    {recentSearches.map((search, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => setSearchQuery(search)}
                            className="flex-row items-center justify-between py-3 border-b border-gray-200"
                        >
                            <View className="flex-row items-center flex-1">
                                <Ionicons name="time-outline" size={20} color={COLORS.gray} />
                                <Text className="ml-3 text-base" style={{ color: COLORS.dark }}>
                                    {search}
                                </Text>
                            </View>
                            <Ionicons name="arrow-forward" size={20} color={COLORS.gray} />
                        </TouchableOpacity>
                    ))}
                </View>
            ) : (
                <View className="flex-1">
                    {loading ? (
                        <View className="flex-1 items-center justify-center">
                            <Text style={{ color: COLORS.gray }}>Aranıyor...</Text>
                        </View>
                    ) : searchResults.length === 0 ? (
                        <View className="flex-1 items-center justify-center px-8">
                            <Ionicons name="search-outline" size={64} color={COLORS.gray} />
                            <Text className="text-xl font-bold mt-4 mb-2 text-center" style={{ color: COLORS.dark }}>
                                Sonuç Bulunamadı
                            </Text>
                            <Text className="text-base text-center" style={{ color: COLORS.gray }}>
                                "{searchQuery}" için sonuç bulunamadı. Başka bir arama deneyin.
                            </Text>
                        </View>
                    ) : (
                        <View className="flex-1">
                            <View className="px-4 py-3 bg-white border-b border-gray-200">
                                <Text className="text-base" style={{ color: COLORS.gray }}>
                                    {searchResults.length} sonuç bulundu
                                </Text>
                            </View>

                            <FlatList
                                data={searchResults}
                                renderItem={renderProduct}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={{ padding: 16 }}
                                showsVerticalScrollIndicator={false}
                            />
                        </View>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}