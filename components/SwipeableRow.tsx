/**
 * SwipeableRow — gesture-driven swipe row with Edit and Delete actions.
 *
 * Swipe left to reveal action buttons.
 * Uses React Native's built-in Animated — no extra dependencies.
 */
import React, { useRef } from "react";
import {
  Animated,
  GestureResponderEvent,
  PanResponderGestureState,
  TouchableOpacity,
  View,
  StyleSheet,
  I18nManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { motion } from "../theme/motion";

const ACTION_WIDTH = 72;

interface SwipeableRowProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function SwipeableRow({ children, onEdit, onDelete }: SwipeableRowProps) {
  const { colors } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const lastX = useRef(0);
  const actionsCount = (onEdit ? 1 : 0) + (onDelete ? 1 : 0);
  const openWidth = -(ACTION_WIDTH * actionsCount);

  function snap(toValue: number, cb?: () => void) {
    Animated.spring(translateX, {
      toValue,
      ...motion.spring.snappy,
    }).start(cb);
    lastX.current = toValue;
  }

  function open() { snap(openWidth); }
  function close() { snap(0); }

  // Pan responder for swipe gesture
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
        const next = gs.dx;
        const clamped = Math.min(0, Math.max(openWidth * 1.2, next));
        translateX.setValue(clamped);
      },
      onPanResponderRelease: (_: GestureResponderEvent, gs: PanResponderGestureState) => {
        translateX.flattenOffset();
        const current = (lastX.current + gs.dx);
        if (current < openWidth / 2) {
          open();
        } else {
          close();
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      {/* Action buttons revealed behind the row */}
      <View style={[styles.actions, { width: -openWidth }]}>
        {onEdit && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => { close(); setTimeout(() => onEdit(), 200); }}
            activeOpacity={0.85}
          >
            <Ionicons name="create-outline" size={22} color="#fff" />
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.red }]}
            onPress={() => { close(); setTimeout(() => onDelete(), 100); }}
            activeOpacity={0.85}
          >
            <Ionicons name="trash-outline" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Row content — slides left */}
      <Animated.View
        style={[styles.row, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    marginBottom: 10,
  },
  actions: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row",
  },
  actionBtn: {
    width: ACTION_WIDTH,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  row: {
    width: "100%",
  },
});
