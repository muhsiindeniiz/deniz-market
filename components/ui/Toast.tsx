    import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SPACING } from '@/lib/constants';

const { width } = Dimensions.get('window');

export interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    onHide?: () => void;
}

const Toast: React.FC<ToastProps> = ({
    message,
    type = 'info',
    duration = 3000,
    onHide
}) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        // Giriş animasyonu
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();

        // Otomatik kapanma
        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: -100,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                onHide?.();
            });
        }, duration);

        return () => clearTimeout(timer);
    }, []);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return 'checkmark-circle';
            case 'error':
                return 'close-circle';
            case 'warning':
                return 'warning';
            default:
                return 'information-circle';
        }
    };

    const getColor = () => {
        switch (type) {
            case 'success':
                return COLORS.primary;
            case 'error':
                return COLORS.danger;
            case 'warning':
                return COLORS.warning;
            default:
                return COLORS.info;
        }
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: getColor(),
                    opacity,
                    transform: [{ translateY }],
                },
            ]}
        >
            <Ionicons name={getIcon() as any} size={24} color={COLORS.white} />
            <Text className="flex-1 ml-3 text-white font-medium" style={styles.message}>
                {message}
            </Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: SPACING.md,
        right: SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 9999,
    },
    message: {
        fontSize: SIZES.md,
        flex: 1,
    },
});

export default Toast;