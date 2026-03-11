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
  TouchableOpacity,
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

  function snap(toValue: number, cb?: () => void) {
    Animated.spring(translateX, { toValue, ...motion.spring.snappy }).start(cb);
    lastX.current = toValue;
  }

  function openRight() { if (leftAction)  snap(rightOpen); }
  function openLeft()  { if (rightAction) snap(leftOpen); }
  function close()     { snap(0); }

  const panResponder = useRef(
    require("react-native").PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_: GestureResponderEvent, gs: PanResponderGestureState) =>
        Math.abs(gs.dx) > 6 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderGrant: () => {
        translateX.stopAnimation();
        translateX.setOffset(lastX.current);
        translateX.setValue(0);
      },
      onPanResponderMove: (_: GestureResponderEvent, gs: PanResponderGestureState) => {
        const raw = gs.dx;
        // Clamp: allow positive (right) only if there's a left action, negative (left) only if right action
        const clamped = Math.min(rightOpen * 1.15, Math.max(leftOpen * 1.15, raw));
        translateX.setValue(clamped);
      },
      onPanResponderRelease: (_: GestureResponderEvent, gs: PanResponderGestureState) => {
        translateX.flattenOffset();
        const current = lastX.current + gs.dx;
        if (current > rightOpen / 2 && leftAction) {
          openRight();
        } else if (current < leftOpen / 2 && rightAction) {
          openLeft();
        } else {
          close();
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      {/* LEFT action button (revealed when row slides right) */}
      {leftAction && (
        <View style={[styles.leftAction, { width: ACTION_WIDTH, backgroundColor: leftColor }]}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => { close(); setTimeout(leftAction, 200); }}
            activeOpacity={0.85}
          >
            <Ionicons name={leftIcon} size={24} color="#fff" />
            <Text style={styles.actionLabel}>{leftIcon === "create-outline" ? "Edit" : "Delete"}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* RIGHT action button (revealed when row slides left) */}
      {rightAction && (
        <View style={[styles.rightAction, { width: ACTION_WIDTH, backgroundColor: rightColor }]}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => { close(); setTimeout(rightAction, 100); }}
            activeOpacity={0.85}
          >
            <Ionicons name={rightIcon} size={24} color="#fff" />
            <Text style={styles.actionLabel}>{rightIcon === "create-outline" ? "Edit" : "Delete"}</Text>
          </TouchableOpacity>
        </View>
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
  },
  rightAction: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
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
  },
  rowMask: {
    borderRadius: 14,
    overflow: "hidden",
  },
});

