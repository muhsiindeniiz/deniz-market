import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '@/lib/constants';

const { width } = Dimensions.get('window');

// Base Skeleton component with shimmer effect
export const SkeletonLoader: React.FC<{ width?: number | string; height: number; borderRadius?: number; style?: any }> = ({
    width: customWidth = '100%',
    height,
    borderRadius = 8,
    style
}) => {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                {
                    width: customWidth,
                    height,
                    borderRadius,
                    backgroundColor: COLORS.gray + '30',
                    opacity,
                },
                style
            ]}
        />
    );
};

// Product Card Skeleton
export const ProductCardSkeleton: React.FC = () => {
    return (
        <View className="bg-white rounded-2xl p-3 mr-3" style={styles.productCard}>
            <SkeletonLoader width={140} height={140} borderRadius={12} />
            <View className="mt-3">
                <SkeletonLoader width="80%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
                <SkeletonLoader width="60%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
                <SkeletonLoader width="40%" height={20} borderRadius={4} />
            </View>
        </View>
    );
};

// Category Card Skeleton
export const CategoryCardSkeleton: React.FC = () => {
    return (
        <View className="bg-white rounded-3xl p-6 mb-4 mx-4" style={styles.categoryCard}>
            <View className="flex-row items-center">
                <SkeletonLoader width={80} height={80} borderRadius={16} />
                <View className="flex-1 ml-4">
                    <SkeletonLoader width="70%" height={18} borderRadius={4} style={{ marginBottom: 8 }} />
                    <SkeletonLoader width="40%" height={14} borderRadius={4} />
                </View>
            </View>
        </View>
    );
};

// Product Detail Skeleton
export const ProductDetailSkeleton: React.FC = () => {
    return (
        <View className="flex-1" style={{ backgroundColor: COLORS.background }}>
            <SkeletonLoader width={width} height={width} borderRadius={0} />
            <View className="p-4">
                <SkeletonLoader width="80%" height={24} borderRadius={4} style={{ marginBottom: 12 }} />
                <SkeletonLoader width="60%" height={18} borderRadius={4} style={{ marginBottom: 12 }} />
                <SkeletonLoader width="100%" height={60} borderRadius={12} style={{ marginBottom: 12 }} />
                <SkeletonLoader width="100%" height={100} borderRadius={12} style={{ marginBottom: 12 }} />
                <SkeletonLoader width="100%" height={150} borderRadius={12} />
            </View>
        </View>
    );
};

// Category List Skeleton
export const CategoryListSkeleton: React.FC = () => {
    return (
        <View className="flex-1" style={{ backgroundColor: COLORS.background }}>
            <View className="bg-white px-4 py-4 border-b border-gray-200">
                <SkeletonLoader width="40%" height={24} borderRadius={4} />
            </View>
            <View className="px-4 py-4">
                {[1, 2, 3, 4, 5].map((item) => (
                    <CategoryCardSkeleton key={item} />
                ))}
            </View>
        </View>
    );
};

// Home Screen Skeleton
export const HomeScreenSkeleton: React.FC = () => {
    return (
        <View className="flex-1" style={{ backgroundColor: COLORS.background }}>
            {/* Header Skeleton */}
            <View className="bg-white px-4 py-3 border-b border-gray-200">
                <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                        <SkeletonLoader width="40%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
                        <SkeletonLoader width="60%" height={16} borderRadius={4} />
                    </View>
                    <View className="flex-row">
                        <SkeletonLoader width={40} height={40} borderRadius={20} style={{ marginRight: 8 }} />
                        <SkeletonLoader width={40} height={40} borderRadius={20} />
                    </View>
                </View>
            </View>

            {/* Search Bar Skeleton */}
            <View className="px-4 pt-4 pb-2">
                <SkeletonLoader width="100%" height={48} borderRadius={16} />
            </View>

            {/* Promo Carousel Skeleton */}
            <View className="px-4 mt-4">
                <SkeletonLoader width="100%" height={160} borderRadius={16} />
            </View>

            {/* Categories Section */}
            <View className="px-4 mt-4">
                <View className="flex-row items-center justify-between mb-3">
                    <SkeletonLoader width="30%" height={20} borderRadius={4} />
                    <SkeletonLoader width="20%" height={16} borderRadius={4} />
                </View>
                <View className="flex-row">
                    {[1, 2, 3].map((item) => (
                        <View key={item} className="mr-3">
                            <SkeletonLoader width={80} height={80} borderRadius={16} style={{ marginBottom: 8 }} />
                            <SkeletonLoader width={80} height={14} borderRadius={4} />
                        </View>
                    ))}
                </View>
            </View>

            {/* Products Section */}
            <View className="px-4 mt-6">
                <View className="flex-row items-center justify-between mb-3">
                    <SkeletonLoader width="35%" height={20} borderRadius={4} />
                    <SkeletonLoader width="20%" height={16} borderRadius={4} />
                </View>
                <View className="flex-row">
                    {[1, 2].map((item) => (
                        <ProductCardSkeleton key={item} />
                    ))}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    productCard: {
        width: 160,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    categoryCard: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
});

export default SkeletonLoader;
