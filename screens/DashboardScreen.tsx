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
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import ProgressRing from "../components/ProgressRing";
import QuickActionCard from "../components/QuickActionCard";
import { colors } from "../theme/colors";
import { dashboardStats } from "../data/placeholders";
import { DashboardStackParamList } from "../navigation/BottomTabs";

type Props = {
  navigation: NativeStackNavigationProp<DashboardStackParamList, "DashboardMain">;
};

const { width } = Dimensions.get("window");
const RING_SIZE = width * 0.72;

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Main Dashboard screen — matches Figma dashboard design.
 * Header, progress ring, estimated completion, active timer, quick actions.
 */
export default function DashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const s = dashboardStats;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 12 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="menu" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <Text style={styles.headerTitle}>  Dashboard</Text>
        </View>
        <View style={{ width: 26 }} />
      </View>

      {/* Progress Ring */}
      <View style={styles.ringWrap}>
        <ProgressRing
          size={RING_SIZE}
          strokeWidth={18}
          progress={s.completedPercent / 100}
          remainingHours={s.remainingHours}
          percentComplete={s.completedPercent}
        />
      </View>

      {/* Estimated Completion */}
      <View style={styles.completionWrap}>
        <Text style={styles.completionLabel}>Estimated Completion Date</Text>
        <Text style={styles.completionDate}>{s.estimatedCompletion}</Text>
      </View>

      {/* Active Timer Card */}
      <View style={styles.timerCard}>
        <View style={styles.timerHeader}>
          <View style={styles.timerHeaderLeft}>
            <View style={styles.activeDot} />
            <Text style={styles.timerHeaderTitle}>Active Timer</Text>
          </View>
          <Text style={styles.timerStartedAt}>Started at {s.timerStartedAt}</Text>
        </View>

        {/* HH / MM / SS boxes */}
        <View style={styles.timerBoxRow}>
          <View style={styles.timerBox}>
            <Text style={styles.timerNumber}>{pad(s.timerHours)}</Text>
            <Text style={styles.timerUnit}>HOURS</Text>
          </View>
          <View style={styles.timerBox}>
            <Text style={styles.timerNumber}>{pad(s.timerMins)}</Text>
            <Text style={styles.timerUnit}>MINS</Text>
          </View>
          <View style={[styles.timerBox]}>
            <Text style={[styles.timerNumber, styles.timerNumberActive]}>{pad(s.timerSecs)}</Text>
            <Text style={[styles.timerUnit, styles.timerUnitActive]}>SECS</Text>
          </View>
        </View>

        {/* Take Break / Time Out */}
        <View style={styles.timerActions}>
          <TouchableOpacity style={styles.breakBtn}>
            <Text style={styles.breakBtnText}>Take Break</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.timeOutBtn}>
            <Text style={styles.timeOutBtnText}>Time Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
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
          subtitle="Claim extra time"
          onPress={() => {}}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.backgroundAlt },
  container: { paddingHorizontal: 20, paddingBottom: 32 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerCenter: { flexDirection: "row", alignItems: "center" },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },

  ringWrap: { alignItems: "center", marginBottom: 20 },

  completionWrap: { alignItems: "center", marginBottom: 28 },
  completionLabel: { color: colors.textSecondary, fontSize: 14, marginBottom: 4 },
  completionDate: { color: colors.text, fontSize: 18, fontWeight: "700" },

  timerCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 28,
  },
  timerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  timerHeaderLeft: { flexDirection: "row", alignItems: "center" },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  timerHeaderTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  timerStartedAt: { color: colors.textSecondary, fontSize: 12 },

  timerBoxRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  timerBox: {
    flex: 1,
    backgroundColor: colors.timerBox,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  timerNumber: { color: colors.text, fontSize: 26, fontWeight: "800", marginBottom: 4 },
  timerNumberActive: { color: colors.primary },
  timerUnit: {
    color: colors.textSecondary,
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "600",
  },
  timerUnitActive: { color: colors.primary },

  timerActions: { flexDirection: "row", gap: 12 },
  breakBtn: {
    flex: 1,
    backgroundColor: colors.timerBox,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  breakBtnText: { color: colors.text, fontSize: 15, fontWeight: "700" },
  timeOutBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  timeOutBtnText: { color: colors.text, fontSize: 15, fontWeight: "700" },

  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 14 },
  quickActionsRow: { flexDirection: "row", gap: 8 },
});
