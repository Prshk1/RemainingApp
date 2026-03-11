import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAppSettings, WEEKDAYS } from "../context/AppSettingsContext";
import { useAuth } from "../context/AuthContext";
import { upsertGoals } from "../services/database/repositories/goals";
import { generateId } from "../utils/generateId";
import { RootStackParamList } from "../App";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function SetGoalsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const { updateSettings, settings } = useAppSettings();
  const { user } = useAuth();

  const [requiredHours, setRequiredHours] = useState(String(settings.requiredHours));
  const [maxHoursPerDay, setMaxHoursPerDay] = useState(String(settings.maxHoursPerDay));
  const [workDays, setWorkDays] = useState<string[]>(settings.workDays);
  const [saving, setSaving] = useState(false);

  function toggleDay(day: string) {
    setWorkDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  }

  async function handleSave() {
    const req = parseFloat(requiredHours);
    const max = parseFloat(maxHoursPerDay);
    if (isNaN(req) || req <= 0 || isNaN(max) || max <= 0 || workDays.length === 0) return;
    setSaving(true);
    try {
      await updateSettings({ requiredHours: req, maxHoursPerDay: max, workDays });
      if (user) {
        upsertGoals(user.id, req, max, workDays, settings.lunchBreakEnabled, settings.timeFormat);
      }
      navigation.navigate("MainTabs");
    } finally {
      setSaving(false);
    }
  }

  const inp = [styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.container, { backgroundColor: colors.backgroundAlt, paddingTop: insets.top + 20 }]}>
        <ScrollView contentContainerStyle={[styles.inner, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
          <Ionicons name="flag-outline" size={48} color={colors.primary} style={styles.icon} />
          <Text style={[styles.title, { color: colors.text }]}>Set Your Goals</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Configure your work hours and schedule to track your progress</Text>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Required Total Hours</Text>
            <TextInput style={inp} value={requiredHours} onChangeText={setRequiredHours} keyboardType="numeric" placeholder="e.g. 400" placeholderTextColor={colors.textMuted} />
            <Text style={[styles.label, { color: colors.textSecondary }]}>Max Hours per Day</Text>
            <TextInput style={inp} value={maxHoursPerDay} onChangeText={setMaxHoursPerDay} keyboardType="numeric" placeholder="e.g. 8" placeholderTextColor={colors.textMuted} />
          </View>

          <Text style={[styles.sectionLabel, { color: colors.text }]}>Work Days</Text>
          <View style={[styles.daysCard, { backgroundColor: colors.card }]}>
            {WEEKDAYS.map((day) => {
              const active = workDays.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayRow, { borderBottomColor: colors.separator }]}
                  onPress={() => toggleDay(day)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayLabel, { color: colors.text }]}>{day}</Text>
                  <View style={[styles.checkbox, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : "transparent" }]}>
                    {active && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12, borderTopColor: colors.separator }]}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: saving ? colors.primaryDim : colors.primary }]}
            onPress={handleSave}
            disabled={saving || workDays.length === 0}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Get Started"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { paddingHorizontal: 20 },
  icon: { alignSelf: "center", marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 28 },
  card: { borderRadius: 16, padding: 16, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 12 },
  sectionLabel: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  daysCard: { borderRadius: 16, overflow: "hidden", marginBottom: 24 },
  dayRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  dayLabel: { fontSize: 15 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
  saveBtn: { borderRadius: 14, height: 52, justifyContent: "center", alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
