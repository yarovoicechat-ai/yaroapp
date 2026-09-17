import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const AnimatedTitleLine = ({ style }) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ]),
        ).start();
    }, []);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-100, 400],
    });

    return (
        <View style={[styles.container, style]}>
            <LinearGradient
                colors={['#03dcfe', '#2911fe', '#ff3366', '#03dcfe']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.line}
            />
            <View style={styles.shimmerContainer}>
                <Animated.View
                    style={[
                        styles.shimmer,
                        { transform: [{ translateX }] },
                    ]}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 2.5,
        width: '100%',
        overflow: 'hidden',
        marginTop: 12,
        marginBottom: 8,
    },
    line: {
        height: 2.5,
        width: '100%',
    },
    shimmerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2.5,
        overflow: 'hidden',
    },
    shimmer: {
        width: 60,
        height: 2.5,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 2,
    },
});

export default AnimatedTitleLine;
