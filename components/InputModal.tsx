/**
 * InputModal — themed replacement for Alert.prompt.
 *
 * Works on both Android and iOS (Alert.prompt is iOS-only).
 * Features:
 *  - Single-line or multiline text input
 *  - Numeric keyboard support
 *  - Animated entrance
 *  - Fully theme-aware
 */
import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { motion } from "../theme/motion";

export interface InputModalProps {
  visible: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  initialValue?: string;
  keyboardType?: "default" | "decimal-pad" | "numeric" | "number-pad";
  confirmLabel?: string;
  cancelLabel?: string;
  /** Called with the final string value when user confirms */
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export default function InputModal({
  visible,
  title,
  message,
  placeholder,
  initialValue = "",
  keyboardType = "default",
  confirmLabel = "Save",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: InputModalProps) {
  const { colors } = useTheme();
  const [value, setValue] = useState(initialValue);
  const slideAnim = useRef(new Animated.Value(motion.translate.modalIn)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, ...motion.spring.bouncy }),
        Animated.timing(opacityAnim, { toValue: 1, duration: motion.duration.fast, useNativeDriver: true }),
      ]).start(() => {
        // Auto-focus after animation
        setTimeout(() => inputRef.current?.focus(), 50);
      });
    } else {
      slideAnim.setValue(motion.translate.modalIn);
      opacityAnim.setValue(0);
    }
  }, [visible, initialValue]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onCancel();
      return true;
    });
    return () => sub.remove();
  }, [visible, onCancel]);

  function handleConfirm() {
    onConfirm(value.trim());
  }

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent onRequestClose={onCancel}>
      {/* Scrim */}
      <Animated.View style={[styles.scrim, { opacity: opacityAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onCancel} activeOpacity={1} />
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.centeredView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: colors.card, borderColor: colors.border },
            { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {message ? (
            <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
          ) : null}

          <TextInput
            ref={inputRef}
            style={[styles.input, { backgroundColor: colors.backgroundAlt ?? colors.background, color: colors.text, borderColor: colors.border }]}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            keyboardType={keyboardType}
            onSubmitEditing={handleConfirm}
            returnKeyType="done"
            selectTextOnFocus
          />

          <View style={[styles.buttonRow, { borderTopColor: colors.separator }]}>
            <TouchableOpacity
              style={[styles.btn, styles.btnCancel, { borderRightColor: colors.separator }]}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={[styles.btnText, { color: colors.textSecondary }]}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn]} onPress={handleConfirm} activeOpacity={0.7}>
              <Text style={[styles.btnText, { color: colors.primary, fontWeight: "700" }]}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
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
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  message: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 12,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginTop: 4,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    marginHorizontal: -20,
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
  btnText: {
    fontSize: 16,
  },
});
