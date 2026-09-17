import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const WaveAnimation = ({ children, isAnimating = true, waveColor = 'rgba(255, 215, 0, 0.4)' }) => {
    const wave1 = useRef(new Animated.Value(0)).current;
    const wave2 = useRef(new Animated.Value(0)).current;
    const wave3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isAnimating) {
            const createAnimation = (animValue, delay) => {
                return Animated.loop(
                    Animated.sequence([
                        Animated.timing(animValue, {
                            toValue: 0,
                            duration: 0,
                            useNativeDriver: true,
                        }),
                        Animated.delay(delay),
                        Animated.timing(animValue, {
                            toValue: 1,
                            duration: 2000,
                            useNativeDriver: true,
                        })
                    ])
                );
            };

            createAnimation(wave1, 0).start();
            createAnimation(wave2, 600).start();
            createAnimation(wave3, 1200).start();
        } else {
            wave1.stopAnimation();
            wave2.stopAnimation();
            wave3.stopAnimation();
            wave1.setValue(0);
            wave2.setValue(0);
            wave3.setValue(0);
        }
    }, [isAnimating]);

    const getAnimatedStyle = (animValue) => {
        return {
            transform: [
                {
                    scale: animValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 2.5]
                    })
                }
            ],
            opacity: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 0]
            })
        };
    };

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.wave, { backgroundColor: waveColor }, getAnimatedStyle(wave1)]} />
            <Animated.View style={[styles.wave, { backgroundColor: waveColor }, getAnimatedStyle(wave2)]} />
            <Animated.View style={[styles.wave, { backgroundColor: waveColor }, getAnimatedStyle(wave3)]} />
            <View style={styles.childrenContainer}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    wave: {
        position: 'absolute',
        width: 140, // Match the avatar container size
        height: 140,
        borderRadius: 70,
    },
    childrenContainer: {
        zIndex: 10,
    }
});

export default WaveAnimation;
