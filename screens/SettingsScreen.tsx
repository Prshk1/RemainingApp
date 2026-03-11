import React from "react";
import { View, ScrollView, Text, Switch, Alert, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Header from "../components/Header";
import SettingsRow from "../components/SettingsRow";
import { useTheme } from "../context/ThemeContext";
import { useAppSettings, WEEKDAYS } from "../context/AppSettingsContext";
import { useAuth } from "../context/AuthContext";
import { ThemeMode } from "../theme/types";
import { RootStackParamList } from "../App";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// Short labels for the work-day chips (Mon, Tue, …)
const DAY_SHORT: Record<string, string> = {
  Sunday: "Sun", Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed",
  Thursday: "Thu", Friday: "Fri", Saturday: "Sat",
};

// Quick-preset helpers
const PRESETS: { label: string; days: string[] }[] = [
  { label: "Mon–Fri", days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
  { label: "Mon–Sat", days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, mode, setMode } = useTheme();
  const { settings, updateSettings } = useAppSettings();
  const { signOut } = useAuth();
  const navigation = useNavigation<NavProp>();

  const THEME_OPTIONS: { label: string; value: ThemeMode; icon: string }[] = [
    { label: "Light", value: "light", icon: "sunny-outline" },
    { label: "Dark", value: "dark", icon: "moon-outline" },
    { label: "System", value: "system", icon: "contrast-outline" },
  ];

  function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  }

  function toggleDay(day: string) {
    const next = settings.workDays.includes(day)
      ? settings.workDays.filter((d) => d !== day)
      : [...settings.workDays, day];
    updateSettings({ workDays: next });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Settings" />
      <ScrollView
        contentContainerStyle={[styles.inner, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── APPEARANCE ──────────────────────────────────── */}
        <Text style={[styles.group, { color: colors.textSecondary }]}>APPEARANCE</Text>
        <View style={[styles.segmentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {THEME_OPTIONS.map((opt, idx) => {
            const active = mode === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.segmentBtn,
                  active && { backgroundColor: colors.primary },
                  idx < THEME_OPTIONS.length - 1 && { borderRightWidth: 1, borderRightColor: colors.border },
                ]}
                onPress={() => setMode(opt.value)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={16}
                  color={active ? "#fff" : colors.textSecondary}
                  style={{ marginBottom: 3 }}
                />
                <Text style={[styles.segmentLabel, { color: active ? "#fff" : colors.textSecondary }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── TIME FORMAT ─────────────────────────────────── */}
        <Text style={[styles.group, { color: colors.textSecondary }]}>TIME FORMAT</Text>
        <View style={[styles.rowCard, { backgroundColor: colors.card }]}>
          <View style={styles.rowCardContent}>
            <Ionicons name="time-outline" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
            <Text style={[styles.rowCardLabel, { color: colors.text }]}>
              {settings.timeFormat === "12h" ? "12-hour (AM/PM)" : "24-hour"}
            </Text>
          </View>
          <Switch
            value={settings.timeFormat === "24h"}
            onValueChange={(v) => updateSettings({ timeFormat: v ? "24h" : "12h" })}
            trackColor={{ false: colors.border, true: colors.primarySoft }}
            thumbColor={settings.timeFormat === "24h" ? colors.primary : colors.textMuted}
          />
        </View>

        {/* ── WORK DAYS ───────────────────────────────────── */}
        <Text style={[styles.group, { color: colors.textSecondary }]}>WORK DAYS</Text>
        {/* Quick presets */}
        <View style={styles.presetRow}>
          {PRESETS.map((p) => {
            const active =
              JSON.stringify([...p.days].sort()) === JSON.stringify([...settings.workDays].sort());
            return (
              <TouchableOpacity
                key={p.label}
                style={[
                  styles.presetBtn,
                  { borderColor: active ? colors.primary : colors.border },
                  active && { backgroundColor: colors.primaryDim },
                ]}
                onPress={() => updateSettings({ workDays: p.days })}
                activeOpacity={0.75}
              >
                <Text style={[styles.presetLabel, { color: active ? colors.primary : colors.textSecondary }]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {/* Day chips */}
        <View style={[styles.chipGrid, { backgroundColor: colors.card }]}>
          {WEEKDAYS.map((day) => {
            const active = settings.workDays.includes(day);
            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayChip,
                  { borderColor: active ? colors.primary : colors.border },
                  active && { backgroundColor: colors.primary },
                ]}
                onPress={() => toggleDay(day)}
                activeOpacity={0.75}
              >
                <Text style={[styles.dayChipText, { color: active ? "#fff" : colors.textSecondary }]}>
                  {DAY_SHORT[day]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── GOALS ───────────────────────────────────────── */}
        <Text style={[styles.group, { color: colors.textSecondary }]}>GOALS</Text>
        <SettingsRow
          label="Required Hours"
          value={`${settings.requiredHours} hrs`}
          onPress={() =>
            Alert.prompt(
              "Required Hours",
              "Total hours to complete",
              (text) => { const n = parseInt(text, 10); if (!isNaN(n) && n > 0) updateSettings({ requiredHours: n }); },
              "plain-text",
              String(settings.requiredHours)
            )
          }
        />
        <SettingsRow
          label="Max Hours / Day"
          value={`${settings.maxHoursPerDay} hrs`}
          onPress={() =>
            Alert.prompt(
              "Max Hours / Day",
              "Used for completion date estimate",
              (text) => { const n = parseFloat(text); if (!isNaN(n) && n > 0) updateSettings({ maxHoursPerDay: n }); },
              "plain-text",
              String(settings.maxHoursPerDay)
            )
          }
        />

        {/* ── ABOUT ───────────────────────────────────────── */}
        <Text style={[styles.group, { color: colors.textSecondary }]}>ABOUT</Text>
        <SettingsRow
          label="About RemainingApp"
          right={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
          onPress={() => navigation.navigate("About")}
        />

        {/* ── ACCOUNT ─────────────────────────────────────── */}
        <Text style={[styles.group, { color: colors.textSecondary }]}>ACCOUNT</Text>
        <SettingsRow
          label="Sign Out"
          labelStyle={{ color: colors.red }}
          right={<Ionicons name="log-out-outline" size={20} color={colors.red} />}
          onPress={handleSignOut}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { paddingHorizontal: 16, paddingTop: 8 },
  group: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginTop: 24, marginBottom: 8, marginLeft: 4 },
  // Appearance segmented control
  segmentCard: { flexDirection: "row", borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 4 },
  segmentBtn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  segmentLabel: { fontSize: 12, fontWeight: "700" },
  // Time format row
  rowCard: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowCardContent: { flexDirection: "row", alignItems: "center" },
  rowCardLabel: { fontSize: 15 },
  // Work days
  presetRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  presetBtn: { borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 7 },
  presetLabel: { fontSize: 13, fontWeight: "600" },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, borderRadius: 14, padding: 14, marginBottom: 4 },
  dayChip: { borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 9, alignItems: "center", justifyContent: "center" },
  dayChipText: { fontSize: 13, fontWeight: "700" },
});
