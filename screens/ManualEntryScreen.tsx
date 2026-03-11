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

function parseHours(dateStr: string, inStr: string, outStr: string): number | null {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const [inH, inM] = inStr.split(":").map(Number);
    const [outH, outM] = outStr.split(":").map(Number);
    const start = new Date(y, m - 1, d, inH, inM).getTime();
    const end = new Date(y, m - 1, d, outH, outM).getTime();
    if (end <= start) return null;
    return parseFloat(((end - start) / 3600000).toFixed(2));
  } catch { return null; }
}

export default function ManualEntryScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { addEntry } = useAttendance();

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [timeIn, setTimeIn] = useState("08:00");
  const [timeOut, setTimeOut] = useState("17:00");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const inp = [styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }];
  const lbl = [styles.label, { color: colors.textSecondary }];

  async function handleSave() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert("Invalid Date", "Please enter date as YYYY-MM-DD"); return;
    }
    if (!/^\d{2}:\d{2}$/.test(timeIn) || !/^\d{2}:\d{2}$/.test(timeOut)) {
      Alert.alert("Invalid Time", "Please enter times as HH:MM (24-hour)"); return;
    }
    const hours = parseHours(date, timeIn, timeOut);
    if (hours === null) { Alert.alert("Invalid Times", "Time out must be after time in"); return; }
    setSaving(true);
    try {
      await addEntry({
        date,
        timeIn: `${date}T${timeIn}:00`,
        timeOut: `${date}T${timeOut}:00`,
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
            <Text style={lbl}>Time In (HH:MM, 24h)</Text>
            <TextInput style={inp} placeholder="08:00" placeholderTextColor={colors.textMuted} value={timeIn} onChangeText={setTimeIn} keyboardType="numbers-and-punctuation" />
            <Text style={lbl}>Time Out (HH:MM, 24h)</Text>
            <TextInput style={inp} placeholder="17:00" placeholderTextColor={colors.textMuted} value={timeOut} onChangeText={setTimeOut} keyboardType="numbers-and-punctuation" />
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
