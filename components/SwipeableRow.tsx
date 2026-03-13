/**
 * SwipeableRow — Telegram-style bidirectional swipe actions.
 *
 * Default (invertSwipeDirection = false):
 *   Swipe RIGHT → reveals Edit  on the LEFT  side
 *   Swipe LEFT  → reveals Delete on the RIGHT side
 *
 * When invertSwipeDirection = true the sides are swapped:
 *   Swipe RIGHT → reveals Delete on the LEFT  side
 *   Swipe LEFT  → reveals Edit   on the RIGHT side
 *
 * Reads invertSwipeDirection from AppSettingsContext automatically.
 * Uses React Native's built-in Animated — no extra dependencies.
 */
import React, { useRef } from "react";
import {
  Animated,
  GestureResponderEvent,
  PanResponderGestureState,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAppSettings } from "../context/AppSettingsContext";
import { motion } from "../theme/motion";

const ACTION_WIDTH = 92;

interface SwipeableRowProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function SwipeableRow({ children, onEdit, onDelete }: SwipeableRowProps) {
  const { colors } = useTheme();
  const { settings } = useAppSettings();
  const invert = settings.invertSwipeDirection ?? false;

  // With invert=false: right swipe = edit (left side), left swipe = delete (right side)
  // With invert=true:  right swipe = delete (left side), left swipe = edit (right side)
  const leftAction  = invert ? onDelete : onEdit;    // revealed by swiping right
  const rightAction = invert ? onEdit   : onDelete;  // revealed by swiping left

  const leftColor  = invert ? colors.red    : colors.primary;
  const rightColor = invert ? colors.primary : colors.red;
  const leftIcon:  "create-outline" | "trash-outline" = invert ? "trash-outline"  : "create-outline";
  const rightIcon: "create-outline" | "trash-outline" = invert ? "create-outline" : "trash-outline";

  const rightOpen  =  (leftAction  ? ACTION_WIDTH : 0); // max positive translateX (swipe right)
  const leftOpen   = -(rightAction ? ACTION_WIDTH : 0); // max negative translateX (swipe left)

  const translateX = useRef(new Animated.Value(0)).current;
  const lastX = useRef(0);
  const currentX = useRef(0);

  function snap(toValue: number, cb?: () => void) {
    Animated.spring(translateX, { toValue, ...motion.spring.snappy }).start(cb);
    lastX.current = toValue;
  }

  function close()     { snap(0); }

  const panResponder = useRef(
    require("react-native").PanResponder.create({
      // Claim the touch immediately when a side is already open (enables tap-to-close)
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_: GestureResponderEvent, gs: PanResponderGestureState) =>
        Math.abs(gs.dx) > 6 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderGrant: () => {
        // Read actual animated position so grabbing mid-spring never jumps the card
        translateX.stopAnimation((current) => {
          lastX.current = current;
          currentX.current = current;
          translateX.setOffset(current);
          translateX.setValue(0);
        });
      },
      onPanResponderMove: (_: GestureResponderEvent, gs: PanResponderGestureState) => {
        // Clamp the absolute position to action bounds — no bounce overshoot
        const rawPos = lastX.current + gs.dx;
        const clampedPos = Math.min(rightOpen, Math.max(leftOpen, rawPos));
        currentX.current = clampedPos;
        translateX.setValue(clampedPos - lastX.current);
      },
      onPanResponderRelease: (_: GestureResponderEvent, gs: PanResponderGestureState) => {
        translateX.flattenOffset();
        const pos = currentX.current;
        if (pos > rightOpen / 2 && leftAction) {
          close();
          setTimeout(leftAction, 120);
          return;
        }
        if (pos < leftOpen / 2 && rightAction) {
          close();
          setTimeout(rightAction, 120);
          return;
        }
        close();
      },
    })
  ).current;

  const leftOpacity = translateX.interpolate({
    inputRange: [0, ACTION_WIDTH * 0.2],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const rightOpacity = translateX.interpolate({
    inputRange: [-ACTION_WIDTH * 0.2, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const leftBgOpacity = leftAction ? leftOpacity : 0;
  const rightBgOpacity = rightAction ? rightOpacity : 0;

  return (
    <View style={styles.container}>
      {/* Seamless color fill visible behind card rounded corners as row slides */}
      <View style={[styles.bgFill, { backgroundColor: colors.card }]}>
        <Animated.View
          style={[styles.bgHalf, { backgroundColor: leftColor, opacity: leftBgOpacity }]}
        />
        <Animated.View
          style={[styles.bgHalf, { backgroundColor: rightColor, opacity: rightBgOpacity }]}
        />
      </View>

      {/* LEFT action button (revealed when row slides right) */}
      {leftAction && (
        <Animated.View
          pointerEvents="none"
          style={[styles.leftAction, { width: ACTION_WIDTH, backgroundColor: leftColor, opacity: leftOpacity }]}
        >
          <View style={styles.actionBtn}>
            <Ionicons name={leftIcon} size={24} color="#fff" />
            <Text style={styles.actionLabel}>{leftIcon === "create-outline" ? "Edit" : "Delete"}</Text>
          </View>
        </Animated.View>
      )}

      {/* RIGHT action button (revealed when row slides left) */}
      {rightAction && (
        <Animated.View
          pointerEvents="none"
          style={[styles.rightAction, { width: ACTION_WIDTH, backgroundColor: rightColor, opacity: rightOpacity }]}
        >
          <View style={styles.actionBtn}>
            <Ionicons name={rightIcon} size={24} color="#fff" />
            <Text style={styles.actionLabel}>{rightIcon === "create-outline" ? "Edit" : "Delete"}</Text>
          </View>
        </Animated.View>
      )}

      {/* Row content — slides with gesture */}
      <Animated.View
        style={[styles.row, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.rowMask}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    marginBottom: 10,
    borderRadius: 14,
  },
  leftAction: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    overflow: "hidden",
  },
  rightAction: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    overflow: "hidden",
  },
  actionBtn: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  actionLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  row: {
    width: "100%",
    zIndex: 2,
  },
  rowMask: {
    borderRadius: 14,
    overflow: "hidden",
  },
  bgFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
  },
  bgHalf: {
    flex: 1,
  },
});

