import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "../context/ThemeContext";

interface ProgressRingProps {
  size: number;
  strokeWidth: number;
  /** 0–1 representing completion fraction */
  progress: number;
  remainingHours: number;
  percentComplete: number;
}

/**
 * Dashboard circular progress ring
 * Shows "REMAINING", large hours, and a pill badge with percent complete.
 */
export default function ProgressRing({
  size,
  strokeWidth,
  progress,
  remainingHours,
  percentComplete,
}: ProgressRingProps) {
  const { colors } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle stroke={colors.border} fill="none" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
        <Circle
          stroke={colors.primary} fill="none" cx={size / 2} cy={size / 2} r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" rotation="-90" origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* Center content */}
      <View style={styles.center}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>REMAINING</Text>
        <View style={styles.hoursRow}>
          <Text style={[styles.hours, { color: colors.text }]}>{remainingHours}</Text>
          <Text style={[styles.hoursUnit, { color: colors.textSecondary }]}>h</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.cardAlt }]}>
          <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{percentComplete}% Complete</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center" },
  label: { fontSize: 12, letterSpacing: 1.5, fontWeight: "600", marginBottom: 4 },
  hoursRow: { flexDirection: "row", alignItems: "flex-end" },
  hours: { fontSize: 52, fontWeight: "800", lineHeight: 60 },
  hoursUnit: { fontSize: 22, fontWeight: "600", marginBottom: 8, marginLeft: 2 },
  badge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginTop: 8 },
  badgeText: { fontSize: 13, fontWeight: "500" },
});
