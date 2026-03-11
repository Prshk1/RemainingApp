import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
}

/** Reusable screen header — back chevron, centered title, optional right icon */
export default function Header({
  title,
  onBack,
  rightIcon,
  onRightPress,
}: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + 8 }]}>
      {/* Left: back button or empty placeholder */}
      <View style={styles.side}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.iconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Center: title */}
      <Text style={styles.title}>{title}</Text>

      {/* Right: optional icon or empty placeholder */}
      <View style={styles.side}>
        {rightIcon ? (
          <TouchableOpacity onPress={onRightPress} style={styles.iconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
    backgroundColor: colors.background,
  },
  side: {
    width: 40,
    alignItems: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  iconBtn: {
    padding: 4,
  },
});
