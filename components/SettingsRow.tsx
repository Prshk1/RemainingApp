import React from "react";
import { View, Text, Switch, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

interface SettingsRowBaseProps {
  label: string;
}

interface SettingsRowChevronProps extends SettingsRowBaseProps {
  type: "chevron";
  value: string;
  onPress?: () => void;
}

interface SettingsRowToggleProps extends SettingsRowBaseProps {
  type: "toggle";
  value: boolean;
  onToggle: (val: boolean) => void;
}

type SettingsRowProps = SettingsRowChevronProps | SettingsRowToggleProps;

/** Single settings list row — label + value/chevron or toggle */
export default function SettingsRow(props: SettingsRowProps) {
  if (props.type === "toggle") {
    return (
      <View style={styles.row}>
        <Text style={styles.label}>{props.label}</Text>
        <Switch
          value={props.value}
          onValueChange={props.onToggle}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.text}
        />
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.row} onPress={props.onPress} activeOpacity={0.7}>
      <Text style={styles.label}>{props.label}</Text>
      <View style={styles.chevronRow}>
        <Text style={styles.value}>{props.value}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={styles.chevron} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  label: {
    color: colors.text,
    fontSize: 15,
  },
  chevronRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  value: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  chevron: {
    marginLeft: 6,
  },
});
