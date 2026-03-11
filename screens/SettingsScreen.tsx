import React from "react";
import { View, ScrollView, Text, Switch, Alert, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import SettingsRow from "../components/SettingsRow";
import { useTheme } from "../context/ThemeContext";
import { useAppSettings, WEEKDAYS } from "../context/AppSettingsContext";
import { useAuth } from "../context/AuthContext";
import { ThemeMode } from "../theme/types";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, mode, setMode } = useTheme();
  const { settings, updateSettings } = useAppSettings();
  const { signOut } = useAuth();

  const THEME_OPTIONS: { label: string; value: ThemeMode }[] = [
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
    { label: "System", value: "system" },
  ];

  function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Settings" />
      <ScrollView
        contentContainerStyle={[styles.inner, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.group, { color: colors.textSecondary }]}>APPEARANCE</Text>
        {THEME_OPTIONS.map((opt) => (
          <SettingsRow
            key={opt.value}
            label={opt.label}
            right={
              mode === opt.value
                ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                : <Ionicons name="ellipse-outline" size={22} color={colors.textMuted} />
            }
            onPress={() => setMode(opt.value)}
          />
        ))}

        <Text style={[styles.group, { color: colors.textSecondary }]}>TIME FORMAT</Text>
        {(["12h", "24h"] as const).map((fmt) => (
          <SettingsRow
            key={fmt}
            label={fmt === "12h" ? "12-hour (AM/PM)" : "24-hour"}
            right={
              settings.timeFormat === fmt
                ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                : <Ionicons name="ellipse-outline" size={22} color={colors.textMuted} />
            }
            onPress={() => updateSettings({ timeFormat: fmt })}
          />
        ))}

        <Text style={[styles.group, { color: colors.textSecondary }]}>WORK DAYS</Text>
        {WEEKDAYS.map((day) => {
          const active = settings.workDays.includes(day);
          return (
            <SettingsRow
              key={day}
              label={day}
              right={
                <Switch
                  value={active}
                  onValueChange={(v) => {
                    const next = v
                      ? [...settings.workDays, day]
                      : settings.workDays.filter((d) => d !== day);
                    updateSettings({ workDays: next });
                  }}
                  trackColor={{ false: colors.border, true: colors.primarySoft }}
                  thumbColor={active ? colors.primary : colors.textMuted}
                />
              }
            />
          );
        })}

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
  group: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginTop: 24, marginBottom: 4, marginLeft: 4 },
});
