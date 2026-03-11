/**
 * ConfirmModal — themed replacement for Alert.alert confirmations.
 *
 * Features:
 *  - Destructive variant (red confirm button)
 *  - Optional "Don't ask again" checkbox
 *  - Animated entrance (slide-up + fade)
 *  - Fully theme-aware (dark / light)
 */
import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { motion } from "../theme/motion";

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** If provided, shows a "Don't ask again" checkbox */
  dontAskAgainLabel?: string;
  dontAskAgainChecked?: boolean;
  onDontAskAgainChange?: (checked: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  dontAskAgainLabel,
  dontAskAgainChecked = false,
  onDontAskAgainChange,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(motion.translate.modalIn)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          ...motion.spring.bouncy,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: motion.duration.fast,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(motion.translate.modalIn);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  // Allow hardware back button to cancel
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onCancel();
      return true;
    });
    return () => sub.remove();
  }, [visible, onCancel]);

  const confirmColor = destructive ? colors.red : colors.primary;
  const confirmBg   = destructive ? colors.redBg : colors.primaryDim;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent onRequestClose={onCancel}>
      {/* Scrim */}
      <Animated.View style={[styles.scrim, { opacity: opacityAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onCancel} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <View style={styles.centeredView} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: colors.card, borderColor: colors.border },
            { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
          ]}
        >
          {/* Icon strip */}
          <View style={[styles.iconWrap, { backgroundColor: confirmBg }]}>
            <Ionicons
              name={destructive ? "trash-outline" : "help-circle-outline"}
              size={28}
              color={confirmColor}
            />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {message ? (
            <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
          ) : null}

          {/* Don't ask again */}
          {dontAskAgainLabel && onDontAskAgainChange && (
            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => onDontAskAgainChange(!dontAskAgainChecked)}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.checkbox,
                  { borderColor: colors.border, backgroundColor: dontAskAgainChecked ? colors.primary : "transparent" },
                ]}
              >
                {dontAskAgainChecked && (
                  <Ionicons name="checkmark" size={13} color="#fff" />
                )}
              </View>
              <Text style={[styles.checkLabel, { color: colors.textSecondary }]}>
                {dontAskAgainLabel}
              </Text>
            </TouchableOpacity>
          )}

          {/* Buttons */}
          <View style={[styles.buttonRow, { borderTopColor: colors.separator }]}>
            <TouchableOpacity
              style={[styles.btn, styles.btnCancel, { borderRightColor: colors.separator }]}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={[styles.btnText, { color: colors.textSecondary }]}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnConfirm]}
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <Text style={[styles.btnText, { color: confirmColor, fontWeight: "700" }]}>
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  sheet: {
    width: "100%",
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    alignItems: "center",
    paddingTop: 28,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checkLabel: {
    fontSize: 13,
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    width: "100%",
  },
  btn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancel: {
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  btnConfirm: {},
  btnText: {
    fontSize: 16,
  },
});
