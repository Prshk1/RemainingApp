import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export interface SettingsRowProps {
  label: string;
  value?: string;
  /** Custom right-side element (overrides value + chevron) */
  right?: React.ReactNode;
  labelStyle?: TextStyle;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function SettingsRow({ label, value, right, labelStyle, onPress, style }: SettingsRowProps) {
  const { colors } = useTheme();

  const rowContent = (
    <>
      <Text style={[styles.label, { color: colors.text }, labelStyle]}>{label}</Text>
      {right ?? (value != null ? (
        <View style={styles.valueRow}>
          <Text style={[styles.value, { color: colors.textSecondary }]}>{value}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={styles.chevron} />
        </View>
      ) : null)}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.row, { borderBottomColor: colors.separator }, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {rowContent}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.row, { borderBottomColor: colors.separator }, style]}>
      {rowContent}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 15, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  label: { fontSize: 15, flex: 1 },
  valueRow: { flexDirection: "row", alignItems: "center" },
  value: { fontSize: 15 },
  chevron: { marginLeft: 6 },
});
