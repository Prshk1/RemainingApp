import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

interface StatCardProps {
  label: string;
  value: string | number;
  unit: string;
}

/** Half-width stat card — used in pairs for Attendance summary row */
export default function StatCard({ label, value, unit }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.unit}> {unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 4,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  value: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: "800",
  },
  unit: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
});
