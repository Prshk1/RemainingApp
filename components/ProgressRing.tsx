import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "../theme/colors";

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
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View style={{ width: size, height: size }}>
      {/* SVG ring */}
      <Svg width={size} height={size}>
        {/* Track ring */}
        <Circle
          stroke={colors.border}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <Circle
          stroke={colors.primary}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* Center content */}
      <View style={styles.center}>
        <Text style={styles.label}>REMAINING</Text>
        <View style={styles.hoursRow}>
          <Text style={styles.hours}>{remainingHours}</Text>
          <Text style={styles.hoursUnit}>h</Text>
        </View>
        {/* Percent pill badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{percentComplete}% Complete</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: "600",
    marginBottom: 4,
  },
  hoursRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  hours: {
    color: colors.text,
    fontSize: 52,
    fontWeight: "800",
    lineHeight: 60,
  },
  hoursUnit: {
    color: colors.textSecondary,
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 2,
  },
  badge: {
    backgroundColor: colors.cardAlt,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginTop: 8,
  },
  badgeText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
});
