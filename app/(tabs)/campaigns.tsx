// app/(tabs)/campaigns.tsx
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/lib/constants';
import { Product } from '@/lib/types';
import ProductCard from '@/components/home/ProductCard';

interface Campaign {
    id: string;
    title: string;
    description: string;
    discount: number;
    type: 'percentage' | 'fixed' | 'bogo';
    image_url: string;
    valid_until: string;
}

export default function CampaignsScreen() {
    const router = useRouter();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [campaignProducts, setCampaignProducts] = useState<Product[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'discount' | 'bogo'>('all');

    useEffect(() => {
        loadCampaigns();
        loadCampaignProducts();
    }, []);

    const loadCampaigns = async () => {
        // Mock data - gerçek kampanya verilerinizi buraya ekleyin
        const mockCampaigns: Campaign[] = [
            {
                id: '1',
                title: '🔥 Süper İndirim',
                description: 'Tüm sebze ve meyvelerde %30 indirim',
                discount: 30,
                type: 'percentage',
                image_url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf',
                valid_until: '2024-12-31',
            },
            {
                id: '2',
                title: '🎁 1 Alana 1 Bedava',
                description: 'Seçili ürünlerde 1 alana 1 bedava',
                discount: 0,
                type: 'bogo',
                image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e',
                valid_until: '2024-12-31',
            },
            {
                id: '3',
                title: '💰 Sepete Özel',
                description: '150₺ üzeri alışverişlerde 20₺ indirim',
                discount: 20,
                type: 'fixed',
                image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da',
                valid_until: '2024-12-31',
            },
        ];
        setCampaigns(mockCampaigns);
    };

    const loadCampaignProducts = async () => {
        try {
            const { data } = await supabase
                .from('products')
                .select('*, category:categories(*), store:stores(*)')
                .not('discount_price', 'is', null)
                .limit(10);

            if (data) setCampaignProducts(data);
        } catch (error) {
            console.error('Error loading campaign products:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadCampaigns();
        await loadCampaignProducts();
        setRefreshing(false);
    };

    const filteredCampaigns = campaigns.filter(campaign => {
        if (activeTab === 'all') return true;
        if (activeTab === 'discount') return campaign.type === 'percentage' || campaign.type === 'fixed';
        if (activeTab === 'bogo') return campaign.type === 'bogo';
        return true;
    });

    return (
        <SafeAreaView style={{ backgroundColor: COLORS.background }}>
            {/* Header */}
            <View className="bg-white px-4 py-4 border-b border-gray-200">
                <Text className="text-2xl font-bold" style={{ color: COLORS.dark }}>
                    Kampanyalar
                </Text>
                <Text className="text-sm mt-1" style={{ color: COLORS.gray }}>
                    {campaigns.length} aktif kampanya
                </Text>
            </View>

            {/* Filter Tabs */}
            <View className="bg-white px-4 py-3 border-b border-gray-200">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                        onPress={() => setActiveTab('all')}
                        className="px-6 py-2 rounded-full mr-3"
                        style={{
                            backgroundColor: activeTab === 'all' ? COLORS.primary : COLORS.background
                        }}
                        activeOpacity={0.7}
                    >
                        <Text
                            className="font-semibold"
                            style={{ color: activeTab === 'all' ? '#FFF' : COLORS.dark }}
                        >
                            Tümü
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setActiveTab('discount')}
                        className="px-6 py-2 rounded-full mr-3"
                        style={{
                            backgroundColor: activeTab === 'discount' ? COLORS.primary : COLORS.background
                        }}
                        activeOpacity={0.7}
                    >
                        <Text
                            className="font-semibold"
                            style={{ color: activeTab === 'discount' ? '#FFF' : COLORS.dark }}
                        >
                            İndirimler
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setActiveTab('bogo')}
                        className="px-6 py-2 rounded-full"
                        style={{
                            backgroundColor: activeTab === 'bogo' ? COLORS.primary : COLORS.background
                        }}
                        activeOpacity={0.7}
                    >
                        <Text
                            className="font-semibold"
                            style={{ color: activeTab === 'bogo' ? '#FFF' : COLORS.dark }}
                        >
                            1 Alana 1 Bedava
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
            >
                {/* Campaign Cards */}
                <View className="px-4 pt-4">
                    {filteredCampaigns.map((campaign, index) => (
                        <TouchableOpacity
                            key={campaign.id}
                            className="bg-white rounded-3xl mb-4 overflow-hidden"
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 8,
                                elevation: 3,
                            }}
                            activeOpacity={0.9}
                        >
                            <Image
                                source={{ uri: campaign.image_url }}
                                className="w-full h-48"
                                resizeMode="cover"
                            />
                            <View className="p-5">
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className="text-xl font-bold flex-1" style={{ color: COLORS.dark }}>
                                        {campaign.title}
                                    </Text>
                                    {campaign.discount > 0 && (
                                        <View
                                            className="px-3 py-1 rounded-full"
                                            style={{ backgroundColor: COLORS.primary + '20' }}
                                        >
                                            <Text className="font-bold" style={{ color: COLORS.primary }}>
                                                {campaign.type === 'percentage' ? `%${campaign.discount}` : `₺${campaign.discount}`}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <Text className="text-sm mb-3" style={{ color: COLORS.gray }}>
                                    {campaign.description}
                                </Text>

                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center">
                                        <Ionicons name="time-outline" size={16} color={COLORS.gray} />
                                        <Text className="text-xs ml-1" style={{ color: COLORS.gray }}>
                                            {new Date(campaign.valid_until).toLocaleDateString('tr-TR')} tarihine kadar
                                        </Text>
                                    </View>

                                    <TouchableOpacity
                                        className="px-5 py-2 rounded-full"
                                        style={{ backgroundColor: COLORS.primary }}
                                        activeOpacity={0.8}
                                    >
                                        <Text className="text-white font-semibold text-sm">
                                            Ürünlere Git
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Campaign Products */}
                {campaignProducts.length > 0 && (
                    <View className="px-4 mt-2 mb-6">
                        <Text className="text-xl font-bold mb-4" style={{ color: COLORS.dark }}>
                            İndirimli Ürünler
                        </Text>

                        <View className="flex-row flex-wrap -mx-2">
                            {campaignProducts.map((product) => (
                                <View key={product.id} className="w-1/2 px-2 mb-4">
                                    <ProductCard product={product} />
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                <View className="h-6" />
            </ScrollView>
        </SafeAreaView>
    );
}