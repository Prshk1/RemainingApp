import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

interface QuickActionCardProps {
  iconName: keyof typeof Ionicons.glyphMap;
  iconBgColor?: string;
  iconColor?: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
}

export default function QuickActionCard({
  iconName, iconBgColor, iconColor, title, subtitle, onPress,
}: QuickActionCardProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.iconCircle, { backgroundColor: iconBgColor ?? colors.primaryDim }]}>
        <Ionicons name={iconName} size={22} color={iconColor ?? colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: 16, padding: 16, marginHorizontal: 4 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 12 },
});
