import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

interface QuickActionCardProps {
  iconName: keyof typeof Ionicons.glyphMap;
  iconBgColor?: string;
  iconColor?: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
}

/** Half-width action card used in the Dashboard Quick Actions row */
export default function QuickActionCard({
  iconName,
  iconBgColor,
  iconColor,
  title,
  subtitle,
  onPress,
}: QuickActionCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.iconCircle, iconBgColor ? { backgroundColor: iconBgColor } : {}]}>
        <Ionicons name={iconName} size={22} color={iconColor ?? colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryDim,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
