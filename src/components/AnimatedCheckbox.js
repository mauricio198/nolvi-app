import React, { useRef, useEffect } from 'react';
import { Animated, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AnimatedCheckbox({ checked, color = '#7C6AF7', onPress, size = 28, disabled = false }) {
  const scale  = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(checked ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: checked ? 1 : 0, duration: 150, useNativeDriver: true }).start();
  }, [checked]);

  const handlePress = () => {
    if (disabled) return;
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.28, useNativeDriver: true, speed: 60, bounciness: 12 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 20, bounciness: 6 }),
    ]).start();
    onPress?.();
  };

  const r = size / 2;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      disabled={disabled}
    >
      <Animated.View style={[
        st.circle,
        { width: size, height: size, borderRadius: r, borderColor: checked ? color : '#D0D0E0' },
        checked && { backgroundColor: color },
        { transform: [{ scale }] },
      ]}>
        <Animated.View style={{ opacity }}>
          <Ionicons name="checkmark" size={size * 0.55} color="#FFF" />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const st = StyleSheet.create({
  circle: { borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
});
