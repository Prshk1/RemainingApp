import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

interface StatCardProps {
  label: string;
  value: string | number;
  unit: string;
}

export default function StatCard({ label, value, unit }: StatCardProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: colors.primary }]}>{value}</Text>
        <Text style={[styles.unit, { color: colors.primary }]}> {unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: 14, padding: 16, marginHorizontal: 4 },
  label: { fontSize: 13, marginBottom: 10, lineHeight: 18 },
  valueRow: { flexDirection: "row", alignItems: "flex-end" },
  value: { fontSize: 32, fontWeight: "800" },
  unit: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
});
