import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

interface HeaderProps {
  title: string;
  onBack?: () => void;
  /** Icon shown to the left of the title text */
  titleIcon?: keyof typeof Ionicons.glyphMap;
  titleIconColor?: string;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  rightElement?: React.ReactNode;
}

export default function Header({ title, onBack, titleIcon, titleIconColor, rightIcon, onRightPress, rightElement }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingTop: insets.top + 10,
          backgroundColor: colors.background,
          borderBottomColor: colors.separator,
        },
      ]}
    >
      {/* Left: back button */}
      <View style={styles.side}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.iconBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Center: optional icon + title */}
      <View style={styles.titleRow}>
        {titleIcon && (
          <Ionicons
            name={titleIcon}
            size={18}
            color={titleIconColor ?? colors.primary}
            style={{ marginRight: 6 }}
          />
        )}
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{title}</Text>
      </View>

      {/* Right: icon button or custom element */}
      <View style={styles.side}>
        {rightElement ? rightElement : rightIcon ? (
          <TouchableOpacity
            onPress={onRightPress}
            style={styles.iconBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name={rightIcon} size={22} color={colors.text} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  side: { width: 40, alignItems: "center" },
  titleRow: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, fontWeight: "700" },
  iconBtn: { padding: 4 },
});

