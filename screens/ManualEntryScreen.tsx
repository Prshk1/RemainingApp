import React, { useState } from "react";
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { useAttendance } from "../context/AttendanceContext";
import { useAuth } from "../context/AuthContext";
import { useAppSettings } from "../context/AppSettingsContext";
import { useNotification } from "../context/NotificationContext";
import { getAttendanceByDate } from "../services/database/repositories/attendance";
import Header from "../components/Header";
import PickerModal from "../components/PickerModal";
import ConfirmModal from "../components/ConfirmModal";

function pad(n: number) { return String(n).padStart(2, "0"); }

/** Format a 24h "HH:MM" string for display according to the user's preferred format. */
function displayTime(hhmm: string, format: "12h" | "24h"): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (format === "24h") return hhmm;
  const ampm = h < 12 ? "AM" : "PM";
  const h12  = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${pad(h12)}:${pad(m)} ${ampm}`;
}

export default function ManualEntryScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { addEntry, updateEntry } = useAttendance();
  const { user } = useAuth();
  const { settings } = useAppSettings();
  const { showNotification } = useNotification();

  const fmt = settings.timeFormat;
  const today = new Date().toISOString().slice(0, 10);

  // Picker values stored as 24h "HH:MM" internally; displayed per timeFormat.
  const [date, setDate]       = useState(today);
  const [timeIn, setTimeIn]   = useState("08:00");
  const [timeOut, setTimeOut] = useState("17:00");
  const [note, setNote]       = useState("");
  const [saving, setSaving]   = useState(false);
  const [confirmingEntry, setConfirmingEntry] = useState<{ existingId: string, hours: number } | null>(null);

  const [showDate, setShowDate]       = useState(false);
  const [showTimeIn, setShowTimeIn]   = useState(false);
  const [showTimeOut, setShowTimeOut] = useState(false);

  const lbl = [styles.label, { color: colors.textSecondary }];

  function handleConfirmExistingEntry() {
    if (confirmingEntry) {
      doSave(confirmingEntry.existingId, confirmingEntry.hours);
      setConfirmingEntry(null);
    }
  }

  async function doSave(existingId: string | null, hours: number) {
    setSaving(true);
    try {
      if (existingId) {
        await updateEntry(existingId, {
          timeIn:  `${date}T${timeIn}:00`,
          timeOut: `${date}T${timeOut}:00`,
          breakMinutes: 0,
          hours,
          note: note.trim() || null,
        });
      } else {
        await addEntry({
          date,
          timeIn:  `${date}T${timeIn}:00`,
          timeOut: `${date}T${timeOut}:00`,
          breakMinutes: 0,
          hours,
          isManual: true,
          note: note.trim() || null,
        });
      }
      navigation.goBack();
    } catch {
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to save. Please try again.",
        duration: 6000,
      });
    }
    finally { setSaving(false); }
  }

  async function handleSave() {
    const [y, mo, d] = date.split("-").map(Number);
    const [inH, inM]   = timeIn.split(":").map(Number);
    const [outH, outM] = timeOut.split(":").map(Number);
    const start = new Date(y, mo - 1, d, inH, inM).getTime();
    const end   = new Date(y, mo - 1, d, outH, outM).getTime();
    if (end <= start) {
      showNotification({
        type: "error",
        title: "Invalid Times",
        message: "Time out must be after time in",
        duration: 6000,
      });
      return;
    }
    let hours = parseFloat(((end - start) / 3600000).toFixed(2));
    // Deduct a fixed 1 hour whenever the shift crosses the 12:00–13:00 lunch window
    const lunchStart = new Date(y, mo - 1, d, 12, 0).getTime();
    const lunchEnd   = new Date(y, mo - 1, d, 13, 0).getTime();
    if (start < lunchEnd && end > lunchStart) {
      hours = Math.max(0, hours - 1);
    }

    const existing = user ? getAttendanceByDate(user.id, date) : null;
    if (existing) {
      setConfirmingEntry({ existingId: existing.id, hours });
      return;
    }

    await doSave(null, hours);
  }

  return (
    <>
      <ConfirmModal
        visible={confirmingEntry !== null}
        title="Entry Already Exists"
        message={`An attendance record for ${date} already exists. Would you like to update it instead?`}
        confirmLabel="Update Existing"
        cancelLabel="Cancel"
        onConfirm={handleConfirmExistingEntry}
        onCancel={() => setConfirmingEntry(null)}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.container, { backgroundColor: colors.backgroundAlt }]}>
        <Header title="Manual Entry" titleIcon="pencil-outline" onBack={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={[styles.inner, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: colors.card }]}>

            <Text style={lbl}>Date</Text>
            <TouchableOpacity
              style={[styles.pickerRow, { borderColor: colors.border, backgroundColor: colors.backgroundAlt ?? colors.background }]}
              onPress={() => setShowDate(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pickerValue, { color: colors.text }]}>{date}</Text>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            </TouchableOpacity>

            <Text style={lbl}>Time In</Text>
            <TouchableOpacity
              style={[styles.pickerRow, { borderColor: colors.border, backgroundColor: colors.backgroundAlt ?? colors.background }]}
              onPress={() => setShowTimeIn(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pickerValue, { color: colors.text }]}>{displayTime(timeIn, fmt)}</Text>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
            </TouchableOpacity>

            <Text style={lbl}>Time Out</Text>
            <TouchableOpacity
              style={[styles.pickerRow, { borderColor: colors.border, backgroundColor: colors.backgroundAlt ?? colors.background }]}
              onPress={() => setShowTimeOut(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pickerValue, { color: colors.text }]}>{displayTime(timeOut, fmt)}</Text>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
            </TouchableOpacity>

            <Text style={lbl}>Note (optional)</Text>
            <TextInput
              style={[styles.noteInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Any notes..."
              placeholderTextColor={colors.textMuted}
              value={note}
              onChangeText={setNote}
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        <PickerModal
          visible={showDate}
          mode="date"
          value={date}
          onConfirm={(v) => { setDate(v); setShowDate(false); }}
          onCancel={() => setShowDate(false)}
        />
        <PickerModal
          visible={showTimeIn}
          mode="time"
          value={timeIn}
          timeFormat={fmt}
          title="Select Time In"
          onConfirm={(v) => { setTimeIn(v); setShowTimeIn(false); }}
          onCancel={() => setShowTimeIn(false)}
        />
        <PickerModal
          visible={showTimeOut}
          mode="time"
          value={timeOut}
          timeFormat={fmt}
          title="Select Time Out"
          onConfirm={(v) => { setTimeOut(v); setShowTimeOut(false); }}
          onCancel={() => setShowTimeOut(false)}
        />

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12, backgroundColor: colors.backgroundAlt, borderTopColor: colors.separator }]}>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: saving ? colors.primaryDim : colors.primary }]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Entry"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { paddingHorizontal: 16 },
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6, marginTop: 4 },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  pickerValue: { fontSize: 15, fontWeight: "500" },
  noteInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingTop: 12, height: 100, fontSize: 15, marginBottom: 12 },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  saveBtn: { borderRadius: 14, height: 52, justifyContent: "center", alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
