/**
 * AnimatedScreenContainer
 *
 * Wraps a screen's root content with a fade + slide-up entrance animation
 * using React Native's built-in Animated API and the shared motion tokens.
 * Drop-in replacement for the root View on any screen.
 */
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, ViewStyle } from "react-native";
import { motion } from "../theme/motion";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export default function AnimatedScreenContainer({ children, style }: Props) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(motion.translate.screenIn)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(opacity,    { toValue: 1, ...motion.spring.gentle }),
      Animated.spring(translateY, { toValue: 0, ...motion.spring.gentle }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity, transform: [{ translateY }] },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
