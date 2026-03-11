import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Header from "../components/Header";
import StatCard from "../components/StatCard";
import AttendanceCard from "../components/AttendanceCard";
import { colors } from "../theme/colors";
import { attendanceEntries, dashboardStats } from "../data/placeholders";
import { AttendanceStackParamList } from "../navigation/BottomTabs";

type Props = {
  navigation: NativeStackNavigationProp<AttendanceStackParamList, "AttendanceMain">;
};

/**
 * Attendance History screen — matches Figma attendance design.
 * Stat cards (total hours, days logged), scrollable attendance list, + FAB.
 */
export default function AttendanceScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    // Header handles its own safe-area top padding — no duplicate paddingTop here
    <View style={styles.container}>
      <Header title="Attendance History" />

      <FlatList
        data={attendanceEntries}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Stat cards row */}
            <View style={styles.statRow}>
              <StatCard
                label={"Total Hours\nLogged"}
                value={dashboardStats.completedHours}
                unit="hrs"
              />
              <StatCard
                label="Days Logged"
                value={dashboardStats.daysLogged}
                unit="days"
              />
            </View>

            {/* Section title */}
            <Text style={styles.sectionTitle}>Attendance List</Text>
          </>
        }
        renderItem={({ item }) => (
          <AttendanceCard
            day={item.day}
            date={item.date}
            timeIn={item.timeIn}
            timeOut={item.timeOut}
            hours={item.hours}
            isManual={item.isManual}
            onPress={() => navigation.navigate("AttendanceDetail")}
          />
        )}
      />

      {/* + FAB bottom-right — navigates to AttendanceDetail as new entry placeholder */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate("AttendanceDetail")}
      >
        <Ionicons name="add" size={28} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  statRow: {
    flexDirection: "row",
    marginBottom: 24,
    marginTop: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
});