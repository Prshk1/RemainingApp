import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

interface BonusItemProps {
  iconName?: keyof typeof Ionicons.glyphMap;
  title: string;
  date: string;
  status: "Approved" | "Pending" | "Rejected";
  hours: number;
  onPress?: () => void;
}

export default function BonusItem({ iconName = "star", title, date, status, hours, onPress }: BonusItemProps) {
  const { colors } = useTheme();
  const isPending = status === "Pending";
  const isRejected = status === "Rejected";
  const circBg = isPending ? colors.cardAlt : isRejected ? colors.redBg : colors.primaryDim;
  const iconColor = isPending ? colors.textMuted : isRejected ? colors.red : colors.primary;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <View style={[styles.iconCircle, { backgroundColor: circBg }]}>
        <Ionicons name={iconName} size={20} color={iconColor} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: isPending ? colors.textSecondary : colors.text }]}>{title}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>{date}</Text>
      </View>
      <Text style={[styles.hours, { color: isPending ? colors.textMuted : colors.primary }]}>
        +{hours.toFixed(1)}<Text style={styles.hoursUnit}>h</Text>
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 14 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", marginRight: 14 },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: "700", marginBottom: 3 },
  meta: { fontSize: 12 },
  hours: { fontSize: 16, fontWeight: "700" },
  hoursUnit: { fontSize: 12, fontWeight: "500" },
});
