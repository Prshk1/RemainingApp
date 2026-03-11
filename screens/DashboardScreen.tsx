import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import ProgressRing from "../components/ProgressRing";
import QuickActionCard from "../components/QuickActionCard";
import AnimatedScreenContainer from "../components/AnimatedScreenContainer";
import { useTheme } from "../context/ThemeContext";
import { useTimer } from "../context/TimerContext";
import { useAttendance } from "../context/AttendanceContext";
import { useBonus } from "../context/BonusContext";
import { useAppSettings } from "../context/AppSettingsContext";
import { formatTime, getDayName } from "../utils/formatTime";
import { RootStackParamList } from "../App";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get("window");
const RING_SIZE = width * 0.72;
const pad = (n: number) => String(n).padStart(2, "0");

function estimateCompletion(
  remainingHours: number,
  maxHoursPerDay: number,
  workDays: string[]
): string {
  if (remainingHours <= 0) return "Completed! ðŸŽ‰";
  if (!workDays.length) return "Set work days in Settings";
  const daysNeeded = Math.ceil(remainingHours / maxHoursPerDay);
  let counted = 0;
  const date = new Date();
  date.setDate(date.getDate() + 1);
  while (counted < daysNeeded) {
    if (workDays.includes(getDayName(date))) counted++;
    if (counted < daysNeeded) date.setDate(date.getDate() + 1);
  }
  return date.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const { timerState, startTime, displayHours, displayMins, displaySecs, timeIn, timeOut, startBreak, endBreak } = useTimer();
  const { totalHours } = useAttendance();
  const { totalApprovedHours } = useBonus();
  const { settings } = useAppSettings();

  const completed = totalHours + totalApprovedHours;
  const required = settings.requiredHours;
  const remaining = Math.max(0, required - completed);
  const percent = Math.min(100, Math.round((completed / required) * 100));
  const estimatedDate = estimateCompletion(remaining, settings.maxHoursPerDay, settings.workDays);

  const isIdle = timerState === "idle";
  const isRunning = timerState === "running";
  const isBreak = timerState === "break";

  return (
    <AnimatedScreenContainer>
      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.backgroundAlt }]}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="layers-outline" size={20} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>  Dashboard</Text>
        </View>
        <View style={[styles.syncBadge, { backgroundColor: colors.primaryDim }]}>
          <View style={[styles.dot, { backgroundColor: isRunning ? colors.green : colors.textMuted }]} />
          <Text style={[styles.syncText, { color: colors.primary }]}>
            {isRunning ? "Active" : isBreak ? "Break" : "Idle"}
          </Text>
        </View>
      </View>

      {/* Progress Ring */}
      <View style={styles.ringWrap}>
        <ProgressRing
          size={RING_SIZE}
          strokeWidth={18}
          progress={percent / 100}
          remainingHours={parseFloat(remaining.toFixed(1))}
          percentComplete={percent}
        />
      </View>

      {/* Estimated Completion */}
      <View style={styles.completionWrap}>
        <Text style={[styles.completionLabel, { color: colors.textSecondary }]}>Estimated Completion Date</Text>
        <Text style={[styles.completionDate, { color: colors.text }]}>{estimatedDate}</Text>
      </View>

      {/* Timer Card */}
      <View style={[styles.timerCard, { backgroundColor: colors.card }]}>
        <View style={styles.timerHeader}>
          <View style={styles.timerHeaderLeft}>
            <View style={[styles.activeDot, { backgroundColor: isRunning ? colors.green : isBreak ? colors.orange : colors.textMuted }]} />
            <Text style={[styles.timerHeaderTitle, { color: colors.text }]}>
              {isIdle ? "Timer" : isBreak ? "On Break" : "Active Timer"}
            </Text>
          </View>
          {startTime && (
            <Text style={[styles.timerStartedAt, { color: colors.textSecondary }]}>
              Started {formatTime(startTime, settings.timeFormat)}
            </Text>
          )}
        </View>

        {/* HH / MM / SS */}
        <View style={styles.timerBoxRow}>
          {[
            { val: displayHours, unit: "HOURS" },
            { val: displayMins, unit: "MINS" },
            { val: displaySecs, unit: "SECS", accent: true },
          ].map(({ val, unit, accent }) => (
            <View key={unit} style={[styles.timerBox, { backgroundColor: colors.timerBox }]}>
              <Text style={[styles.timerNumber, accent && { color: colors.primary }]}>
                {pad(val)}
              </Text>
              <Text style={[styles.timerUnit, accent && { color: colors.primary }]}>{unit}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        {isIdle ? (
          <TouchableOpacity style={[styles.timeInBtn, { backgroundColor: colors.primary }]} onPress={timeIn} activeOpacity={0.85}>
            <Ionicons name="play" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.timeInBtnText}>Time In</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.timerActions}>
            {isBreak ? (
              <TouchableOpacity style={[styles.breakBtn, { backgroundColor: colors.timerBox }]} onPress={endBreak}>
                <Ionicons name="play" size={16} color={colors.text} style={{ marginRight: 6 }} />
                <Text style={[styles.breakBtnText, { color: colors.text }]}>End Break</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.breakBtn, { backgroundColor: colors.timerBox }]} onPress={startBreak}>
                <Ionicons name="pause" size={16} color={colors.text} style={{ marginRight: 6 }} />
                <Text style={[styles.breakBtnText, { color: colors.text }]}>Take Break</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.timeOutBtn, { backgroundColor: colors.redBg, borderColor: colors.red }]} onPress={timeOut}>
              <Ionicons name="stop" size={16} color={colors.red} style={{ marginRight: 6 }} />
              <Text style={[styles.timeOutBtnText, { color: colors.red }]}>Time Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
      <View style={styles.quickActionsRow}>
        <QuickActionCard
          iconName="document-text-outline"
          title="Manual Entry"
          subtitle="Log past hours"
          onPress={() => navigation.navigate("ManualEntry")}
        />
        <QuickActionCard
          iconName="star-outline"
          iconBgColor="rgba(255,167,38,0.15)"
          iconColor="#FFA726"
          title="Bonus Hours"
          subtitle="Log credited time"
          onPress={() => navigation.navigate("AddBonus")}
        />
      </View>

      {/* Summary Cards */}
      <View style={[styles.summaryRow, { marginTop: 20 }]}>
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Hours Logged</Text>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>{totalHours.toFixed(1)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Bonus Hours</Text>
          <Text style={[styles.summaryValue, { color: colors.orange }]}>{totalApprovedHours.toFixed(1)}</Text>
        </View>
      </View>
    </ScrollView>
    </AnimatedScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  syncBadge: { flexDirection: "row", alignItems: "center", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  syncText: { fontSize: 12, fontWeight: "600" },
  ringWrap: { alignItems: "center", marginBottom: 20 },
  completionWrap: { alignItems: "center", marginBottom: 28 },
  completionLabel: { fontSize: 13, marginBottom: 4 },
  completionDate: { fontSize: 17, fontWeight: "700" },
  timerCard: { borderRadius: 20, padding: 18, marginBottom: 28 },
  timerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  timerHeaderLeft: { flexDirection: "row", alignItems: "center" },
  activeDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  timerHeaderTitle: { fontSize: 15, fontWeight: "700" },
  timerStartedAt: { fontSize: 12 },
  timerBoxRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  timerBox: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  timerNumber: { fontSize: 26, fontWeight: "800", marginBottom: 4, color: "#fff" },
  timerUnit: { color: "#aaa", fontSize: 10, letterSpacing: 1, fontWeight: "600" },
  timeInBtn: { borderRadius: 12, height: 48, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  timeInBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  timerActions: { flexDirection: "row", gap: 12 },
  breakBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  breakBtnText: { fontSize: 14, fontWeight: "700" },
  timeOutBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", borderWidth: 1 },
  timeOutBtnText: { fontSize: 14, fontWeight: "700" },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  quickActionsRow: { flexDirection: "row", gap: 8 },
  summaryRow: { flexDirection: "row", gap: 8 },
  summaryCard: { flex: 1, borderRadius: 14, padding: 16, alignItems: "center" },
  summaryLabel: { fontSize: 12, marginBottom: 6 },
  summaryValue: { fontSize: 28, fontWeight: "800" },
});
