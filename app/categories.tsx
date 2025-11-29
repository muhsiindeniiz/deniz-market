// app/categories.tsx
import { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Category } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface CategoryWithCount extends Category {
  product_count: number;
  is_featured?: boolean;
}

// Memoized Category Card Component
const CategoryCard = memo(({ 
  item, 
  index, 
  onPress 
}: { 
  item: CategoryWithCount; 
  index: number;
  onPress: () => void;
}) => {
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        width: CARD_WIDTH,
        marginLeft: index % 2 === 0 ? 16 : 8,
        marginRight: index % 2 === 1 ? 16 : 8,
        marginBottom: 16,
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={{
          backgroundColor: '#fff',
          borderRadius: 20,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        {/* Image Container */}
        <View
          style={{
            height: CARD_WIDTH * 0.85,
            backgroundColor: item.color ? `${item.color}15` : '#F5F5F5',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={{
                width: '70%',
                height: '70%',
              }}
              resizeMode="contain"
            />
          ) : (
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: item.color ? `${item.color}30` : '#E0E0E0',
              }}
            />
          )}
          
          {/* Featured Badge */}
          {item.is_featured && (
            <View
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                backgroundColor: COLORS.primary,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>
                Popüler
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={{ padding: 14 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: COLORS.dark,
              marginBottom: 4,
            }}
          >
            {item.name}
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.gray }}>
            {item.product_count} ürün
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// Featured Category Card (Horizontal)
const FeaturedCategoryCard = memo(({ 
  item, 
  onPress 
}: { 
  item: CategoryWithCount;
  onPress: () => void;
}) => {
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={{
          width: width * 0.42,
          height: 160,
          marginRight: 12,
          borderRadius: 20,
          overflow: 'hidden',
        }}
      >
        <LinearGradient
          colors={[item.color || '#6366F1', `${item.color || '#6366F1'}CC`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            padding: 16,
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text
              numberOfLines={2}
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#fff',
                marginBottom: 4,
              }}
            >
              {item.name}
            </Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
              {item.product_count} ürün
            </Text>
          </View>

          {item.image_url && (
            <Image
              source={{ uri: item.image_url }}
              style={{
                width: 60,
                height: 60,
                alignSelf: 'flex-end',
                opacity: 0.9,
              }}
              resizeMode="contain"
            />
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
});

// Skeleton Components
const SkeletonCard = memo(() => (
  <View
    style={{
      width: CARD_WIDTH,
      marginHorizontal: 8,
      marginBottom: 16,
      backgroundColor: '#fff',
      borderRadius: 20,
      overflow: 'hidden',
    }}
  >
    <View
      style={{
        height: CARD_WIDTH * 0.85,
        backgroundColor: '#F0F0F0',
      }}
    />
    <View style={{ padding: 14 }}>
      <View
        style={{
          height: 16,
          width: '70%',
          backgroundColor: '#F0F0F0',
          borderRadius: 8,
          marginBottom: 8,
        }}
      />
      <View
        style={{
          height: 14,
          width: '40%',
          backgroundColor: '#F0F0F0',
          borderRadius: 8,
        }}
      />
    </View>
  </View>
));

const FeaturedSkeleton = memo(() => (
  <View
    style={{
      width: width * 0.42,
      height: 160,
      marginRight: 12,
      borderRadius: 20,
      backgroundColor: '#F0F0F0',
    }}
  />
));

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryWithCount[]>([]);
  const [featuredCategories, setFeaturedCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollY = new Animated.Value(0);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [searchQuery, categories]);

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
        const categoriesWithCount: CategoryWithCount[] = data.map((category: any) => ({
          ...category,
          product_count: category.products?.[0]?.count || 0,
        }));

        // Sort by product count for featured (top 4)
        const sorted = [...categoriesWithCount].sort(
          (a, b) => b.product_count - a.product_count
        );
        const featured = sorted.slice(0, 4).map(cat => ({
          ...cat,
          is_featured: true,
        }));

        setCategories(categoriesWithCount);
        setFilteredCategories(categoriesWithCount);
        setFeaturedCategories(featured);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadCategories();
  }, []);

  const handleCategoryPress = useCallback((categoryId: string) => {
    router.push(`/category/${categoryId}`);
  }, [router]);

  const renderHeader = () => (
    <View>
      {/* Search Bar */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#fff',
            borderRadius: 14,
            paddingHorizontal: 14,
            height: 48,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Ionicons name="search" size={20} color={COLORS.gray} />
          <TextInput
            placeholder="Kategori ara..."
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              marginLeft: 10,
              fontSize: 15,
              color: COLORS.dark,
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Featured Categories */}
      {!searchQuery && featuredCategories.length > 0 && (
        <View style={{ marginBottom: 8 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: COLORS.dark,
              }}
            >
              Popüler Kategoriler
            </Text>
          </View>

          {loading ? (
            <FlatList
              data={[1, 2, 3]}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              keyExtractor={(item) => item.toString()}
              renderItem={() => <FeaturedSkeleton />}
            />
          ) : (
            <FlatList
              data={featuredCategories}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              keyExtractor={(item) => `featured-${item.id}`}
              renderItem={({ item }) => (
                <FeaturedCategoryCard
                  item={item}
                  onPress={() => handleCategoryPress(item.id)}
                />
              )}
            />
          )}
        </View>
      )}

      {/* All Categories Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 12,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.dark }}>
          {searchQuery ? 'Arama Sonuçları' : 'Tüm Kategoriler'}
        </Text>
        <Text style={{ fontSize: 14, color: COLORS.gray }}>
          {filteredCategories.length} kategori
        </Text>
      </View>
    </View>
  );

  const renderCategory = useCallback(
    ({ item, index }: { item: CategoryWithCount; index: number }) => (
      <CategoryCard
        item={item}
        index={index}
        onPress={() => handleCategoryPress(item.id)}
      />
    ),
    [handleCategoryPress]
  );

  const renderEmpty = () => (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
      }}
    >
      <Ionicons name="search-outline" size={64} color={COLORS.gray} />
      <Text
        style={{
          fontSize: 18,
          fontWeight: '600',
          color: COLORS.dark,
          marginTop: 16,
        }}
      >
        Sonuç bulunamadı
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: COLORS.gray,
          marginTop: 8,
          textAlign: 'center',
        }}
      >
        "{searchQuery}" ile eşleşen kategori yok
      </Text>
    </View>
  );

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <Animated.View
        style={{
          backgroundColor: '#fff',
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: '#F0F0F0',
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: COLORS.background,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.dark }}>
          Kategoriler
        </Text>
      </Animated.View>

      {/* Content */}
      {loading ? (
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          numColumns={2}
          ListHeaderComponent={renderHeader}
          keyExtractor={(item) => item.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={() => <SkeletonCard />}
        />
      ) : (
        <Animated.FlatList
          data={filteredCategories}
          numColumns={2}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}