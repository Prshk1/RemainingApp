import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

interface BonusItemProps {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  date: string;
  status: "Approved" | "Pending";
  hours: number;
}

/** Single bonus history row — icon circle, title + date·status, hours right */
export default function BonusItem({
  iconName,
  title,
  date,
  status,
  hours,
}: BonusItemProps) {
  const isPending = status === "Pending";

  return (
    <View style={styles.card}>
      {/* Icon circle */}
      <View style={[styles.iconCircle, isPending && styles.iconCirclePending]}>
        <Ionicons
          name={iconName}
          size={20}
          color={isPending ? colors.textMuted : colors.primary}
        />
      </View>

      {/* Text content */}
      <View style={styles.content}>
        <Text style={[styles.title, isPending && styles.titlePending]}>
          {title}
        </Text>
        <Text style={styles.meta}>
          {date} • {status}
        </Text>
      </View>

      {/* Hours */}
      <Text style={[styles.hours, isPending && styles.hoursPending]}>
        +{hours.toFixed(1)}
        <Text style={styles.hoursUnit}>h</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryDim,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  iconCirclePending: {
    backgroundColor: colors.cardAlt,
  },
  content: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 3,
  },
  titlePending: {
    color: colors.textSecondary,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  hours: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  hoursPending: {
    color: colors.textSecondary,
  },
  hoursUnit: {
    fontSize: 12,
    fontWeight: "500",
  },
});
