import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { useAttendance } from "../context/AttendanceContext";
import { useAppSettings } from "../context/AppSettingsContext";

/**
 * Parse a time string in either 24h ("HH:MM") or 12h ("H:MM AM/PM") format.
 * Returns "HH:MM" (24h) for internal storage, or null if invalid.
 */
function parseTimeInput(input: string, format: "12h" | "24h"): string | null {
  const trimmed = input.trim();
  if (format === "24h") {
    if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
      const [h, m] = trimmed.split(":").map(Number);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59)
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    return null;
  }
  // 12h: "8:00 AM", "12:30 PM" etc.
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (h < 1 || h > 12 || m < 0 || m > 59) return null;
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function ManualEntryScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { addEntry } = useAttendance();
  const { settings } = useAppSettings();

  const fmt = settings.timeFormat;
  const timePlaceholder = fmt === "12h" ? "08:00 AM" : "08:00";
  const timeOutPlaceholder = fmt === "12h" ? "05:00 PM" : "17:00";
  const timeLabel = fmt === "12h" ? "(12h — e.g. 08:00 AM)" : "(24h — e.g. 14:30)";

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [timeIn, setTimeIn] = useState(fmt === "12h" ? "08:00 AM" : "08:00");
  const [timeOut, setTimeOut] = useState(fmt === "12h" ? "05:00 PM" : "17:00");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const inp = [styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }];
  const lbl = [styles.label, { color: colors.textSecondary }];

  async function handleSave() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert("Invalid Date", "Please enter date as YYYY-MM-DD"); return;
    }
    const parsedIn = parseTimeInput(timeIn, fmt);
    const parsedOut = parseTimeInput(timeOut, fmt);
    if (!parsedIn || !parsedOut) {
      const hint = fmt === "12h" ? "e.g. 08:00 AM or 05:00 PM" : "e.g. 08:00 or 17:00";
      Alert.alert("Invalid Time", `Please enter times as ${hint}`); return;
    }
    // Calculate hours from 24h strings
    const [y, mo, d] = date.split("-").map(Number);
    const [inH, inM] = parsedIn.split(":").map(Number);
    const [outH, outM] = parsedOut.split(":").map(Number);
    const start = new Date(y, mo - 1, d, inH, inM).getTime();
    const end = new Date(y, mo - 1, d, outH, outM).getTime();
    if (end <= start) { Alert.alert("Invalid Times", "Time out must be after time in"); return; }
    const hours = parseFloat(((end - start) / 3600000).toFixed(2));
    setSaving(true);
    try {
      await addEntry({
        date,
        timeIn: `${date}T${parsedIn}:00`,
        timeOut: `${date}T${parsedOut}:00`,
        breakMinutes: 0,
        hours,
        isManual: true,
        note: note.trim() || null,
      });
      navigation.goBack();
    } catch { Alert.alert("Error", "Failed to save. Please try again."); }
    finally { setSaving(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.container, { backgroundColor: colors.backgroundAlt, paddingTop: insets.top + 8 }]}>
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.text }]}>Manual Entry</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView contentContainerStyle={[styles.inner, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={lbl}>Date (YYYY-MM-DD)</Text>
            <TextInput style={inp} placeholder="2024-01-15" placeholderTextColor={colors.textMuted} value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" />
            <Text style={lbl}>Time In {timeLabel}</Text>
            <TextInput style={inp} placeholder={timePlaceholder} placeholderTextColor={colors.textMuted} value={timeIn} onChangeText={setTimeIn} keyboardType="numbers-and-punctuation" />
            <Text style={lbl}>Time Out {timeLabel}</Text>
            <TextInput style={inp} placeholder={timeOutPlaceholder} placeholderTextColor={colors.textMuted} value={timeOut} onChangeText={setTimeOut} keyboardType="numbers-and-punctuation" />
            <Text style={lbl}>Note (optional)</Text>
            <TextInput style={[inp, styles.noteInput]} placeholder="Any notes..." placeholderTextColor={colors.textMuted} value={note} onChangeText={setNote} multiline textAlignVertical="top" />
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12, backgroundColor: colors.backgroundAlt, borderTopColor: colors.separator }]}>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: saving ? colors.primaryDim : colors.primary }]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Entry"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8 },
  navTitle: { fontSize: 17, fontWeight: "700" },
  inner: { paddingHorizontal: 16 },
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6, marginTop: 4 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 12 },
  noteInput: { height: 100, paddingTop: 12 },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  saveBtn: { borderRadius: 14, height: 52, justifyContent: "center", alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
