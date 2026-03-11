import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../context/ThemeContext";
import { useAttendance } from "../context/AttendanceContext";
import { useAppSettings } from "../context/AppSettingsContext";
import { RootStackParamList } from "../App";

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RoutePropType = RouteProp<RootStackParamList, "AttendanceDetail">;

export default function AttendanceDetailScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { entries, deleteEntry } = useAttendance();
  const { settings } = useAppSettings();

  const entry = entries.find((e) => e.id === route.params.entryId);

  function handleDelete() {
    Alert.alert("Delete Entry", "Are you sure you want to delete this entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (entry) { await deleteEntry(entry.id); navigation.goBack(); }
        },
      },
    ]);
  }

  if (!entry) {
    return (
      <View style={[styles.container, { backgroundColor: colors.backgroundAlt, paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.notFound, { color: colors.textSecondary }]}>Entry not found</Text>
      </View>
    );
  }

  function fmtTime(iso: string | null): string {
    if (!iso) return "--";
    return new Date(iso).toLocaleTimeString("en-US", { hour12: settings.timeFormat === "12h", hour: "2-digit", minute: "2-digit" });
  }

  const dataRows = [
    { label: "Date", value: new Date(entry.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) },
    { label: "Time In", value: fmtTime(entry.timeIn) },
    { label: "Time Out", value: fmtTime(entry.timeOut) },
    { label: "Break", value: `${entry.breakMinutes} min` },
    { label: "Total Hours", value: entry.hours != null ? `${entry.hours.toFixed(2)} hrs` : "--" },
    { label: "Type", value: entry.isManual ? "Manual Entry" : "Timer" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundAlt, paddingTop: insets.top + 8 }]}>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>Attendance Detail</Text>
        <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={22} color={colors.red} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.inner, { paddingBottom: insets.bottom + 80 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.hoursBadgeWrap}>
          <View style={[styles.hoursBadge, { backgroundColor: colors.primaryDim }]}>
            <Text style={[styles.hoursBadgeText, { color: colors.primary }]}>
              {entry.hours != null ? `${entry.hours.toFixed(1)} hrs` : "--"}
            </Text>
          </View>
          {entry.isManual ? (
            <View style={[styles.typeBadge, { backgroundColor: colors.timerBox }]}>
              <Text style={[styles.typeBadgeText, { color: colors.textSecondary }]}>Manual</Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {dataRows.map(({ label, value }, i) => (
            <View
              key={label}
              style={[
                styles.dataRow,
                i < dataRows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
              ]}
            >
              <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>{label}</Text>
              <Text style={[styles.dataValue, { color: colors.text }]}>{value}</Text>
            </View>
          ))}
        </View>

        {entry.note ? (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.noteLabel, { color: colors.textSecondary }]}>Note</Text>
            <Text style={[styles.noteText, { color: colors.text }]}>{entry.note}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12, borderTopColor: colors.separator }]}>
        <TouchableOpacity
          style={[styles.journalBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigation.navigate("Journal", { entryId: entry.id })}
          activeOpacity={0.8}
        >
          <Ionicons name="journal-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.journalBtnText, { color: colors.primary }]}>
            {entry.note ? "Edit Journal Note" : "Add Journal Note"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  notFound: { textAlign: "center", marginTop: 40, fontSize: 16 },
  navbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8 },
  navTitle: { fontSize: 17, fontWeight: "700" },
  inner: { paddingHorizontal: 16 },
  hoursBadgeWrap: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  hoursBadge: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  hoursBadgeText: { fontSize: 20, fontWeight: "800" },
  typeBadge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  typeBadgeText: { fontSize: 13, fontWeight: "600" },
  card: { borderRadius: 16, overflow: "hidden", marginBottom: 16 },
  dataRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  dataLabel: { fontSize: 14 },
  dataValue: { fontSize: 14, fontWeight: "600" },
  noteLabel: { fontSize: 12, fontWeight: "600", marginBottom: 4, paddingHorizontal: 16, paddingTop: 12 },
  noteText: { fontSize: 14, lineHeight: 22, paddingHorizontal: 16, paddingBottom: 16 },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  journalBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 14, height: 52, borderWidth: 1 },
  journalBtnText: { fontSize: 15, fontWeight: "700" },
});
