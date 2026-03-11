import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

interface AttendanceCardProps {
  day: string;
  date: string;
  timeIn: string;
  timeOut: string;
  hours: number;
  isManual?: boolean;
  onPress?: () => void;
}

/** Single attendance row — calendar icon, date/time, hours right-aligned */
export default function AttendanceCard({
  day,
  date,
  timeIn,
  timeOut,
  hours,
  isManual,
  onPress,
}: AttendanceCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      {/* Calendar icon box */}
      <View style={styles.iconBox}>
        <Ionicons name="calendar" size={20} color={colors.primary} />
      </View>

      {/* Text content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.dayDate}>
            {day}, {date}
          </Text>
          {isManual && (
            <Ionicons
              name="create-outline"
              size={14}
              color={colors.textSecondary}
              style={styles.editIcon}
            />
          )}
        </View>
        <Text style={styles.times}>
          In: {timeIn} - Out: {timeOut}
        </Text>
      </View>

      {/* Hours */}
      <Text style={styles.hours}>{hours} hrs</Text>
    </TouchableOpacity>
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
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.cardAlt,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  dayDate: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  editIcon: {
    marginLeft: 6,
  },
  times: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  hours: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
});
