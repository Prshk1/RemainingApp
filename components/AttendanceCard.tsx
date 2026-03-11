import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

interface AttendanceCardProps {
  day: string;
  date: string;
  timeIn: string;
  timeOut: string;
  hours: number;
  isManual?: boolean;
  onPress?: () => void;
}

export default function AttendanceCard({
  day,
  date,
  timeIn,
  timeOut,
  hours,
  isManual,
  onPress,
}: AttendanceCardProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]} onPress={onPress} activeOpacity={1}>
      <View style={[styles.iconBox, { backgroundColor: colors.cardAlt }]}>
        <Ionicons name="calendar" size={20} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.dayDate, { color: colors.text }]}>
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
        <Text style={[styles.times, { color: colors.textSecondary }]}>
          In: {timeIn} - Out: {timeOut}
        </Text>
      </View>

      <Text style={[styles.hours, { color: colors.text }]}>{hours} hrs</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 14 },
  iconBox: { width: 44, height: 44, borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 14 },
  content: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  dayDate: { fontSize: 15, fontWeight: "600" },
  editIcon: { marginLeft: 6 },
  times: { fontSize: 13 },
  hours: { fontSize: 15, fontWeight: "700" },
});
