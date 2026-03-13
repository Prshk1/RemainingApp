import React, { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Header from "../components/Header";
import StatCard from "../components/StatCard";
import AttendanceCard from "../components/AttendanceCard";
import SwipeableRow from "../components/SwipeableRow";
import ConfirmModal from "../components/ConfirmModal";
import AnimatedScreenContainer from "../components/AnimatedScreenContainer";
import { TAB_BAR_HEIGHT } from "../components/CustomTabBar";
import { useTheme } from "../context/ThemeContext";
import { useAttendance, AttendanceEntry } from "../context/AttendanceContext";
import { useAppSettings } from "../context/AppSettingsContext";
import { getAttachmentsByEntryId } from "../services/database/repositories/attachments";
import { getAttendanceById } from "../services/database/repositories/attendance";
import { RootStackParamList } from "../App";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function AttendanceScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const { entries, totalHours, daysLogged, refresh, deleteEntry } = useAttendance();
  const { settings, updateSettings } = useAppSettings();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [dontAskAgain, setDontAskAgain] = useState(false);

  useFocusEffect(
    useCallback(() => { refresh(); }, [refresh])
  );

  function requestDelete(id: string) {
    if (!settings.confirmAttendanceDelete) {
      deleteEntry(id);
    } else {
      setDeleteTarget(id);
    }
  }

  function handleSwipeEdit(entry: AttendanceEntry) {
    const persisted = getAttendanceById(entry.id);
    const noteValue = persisted?.note ?? entry.note;
    const hasNote = Boolean(noteValue && noteValue.trim().length > 0);
    if (hasNote) {
      navigation.navigate("AttendanceDetail", { entryId: entry.id });
      return;
    }

    // Keep swipe behavior aligned with AttendanceDetail's journal CTA semantics.
    const hasAttachments = getAttachmentsByEntryId(entry.id).length > 0;
    navigation.navigate(hasAttachments ? "AttendanceDetail" : "Journal", { entryId: entry.id });
  }

  return (
    <AnimatedScreenContainer style={{ backgroundColor: colors.background }}>
      <Header title="Attendance History" titleIcon="calendar" />

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 20 }]}
        ListHeaderComponent={
          <>
            <View style={styles.statRow}>
              <StatCard
                label={"Total Hours\nLogged"}
                value={parseFloat(totalHours.toFixed(1))}
                unit="hrs"
              />
              <StatCard label="Days Logged" value={daysLogged} unit="days" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Attendance List</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No entries yet</Text>
            <Text style={[styles.emptySubText, { color: colors.textMuted }]}>Tap + to add a manual entry</Text>
          </View>
        }
        renderItem={({ item }) => (
          <SwipeableRow
            onEdit={() => handleSwipeEdit(item)}
            onDelete={() => requestDelete(item.id)}
          >
            <AttendanceCard
              day={new Date(item.date).toLocaleDateString("en-US", { weekday: "short" })}
              date={new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              timeIn={item.timeIn ? new Date(item.timeIn).toLocaleTimeString("en-US", { hour12: settings.timeFormat === "12h", hour: "2-digit", minute: "2-digit" }) : "--"}
              timeOut={item.timeOut ? new Date(item.timeOut).toLocaleTimeString("en-US", { hour12: settings.timeFormat === "12h", hour: "2-digit", minute: "2-digit" }) : "--"}
              hours={item.hours ?? 0}
              isManual={item.isManual}
              onPress={() => navigation.navigate("AttendanceDetail", { entryId: item.id })}
            />
          </SwipeableRow>
        )}
      />

      <ConfirmModal
        visible={deleteTarget !== null}
        title="Delete Entry"
        message="Are you sure you want to delete this attendance entry?"
        confirmLabel="Delete"
        destructive
        dontAskAgainLabel="Don't ask again for attendance"
        dontAskAgainChecked={dontAskAgain}
        onDontAskAgainChange={setDontAskAgain}
        onConfirm={() => {
          if (deleteTarget) deleteEntry(deleteTarget);
          if (dontAskAgain) updateSettings({ confirmAttendanceDelete: false });
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + TAB_BAR_HEIGHT + 12, backgroundColor: colors.primary }]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate("ManualEntry")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </AnimatedScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 16 },
  statRow: { flexDirection: "row", marginBottom: 24, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 14 },
  emptyWrap: { alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: 16, fontWeight: "600", marginTop: 12 },
  emptySubText: { fontSize: 13, marginTop: 4 },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});
