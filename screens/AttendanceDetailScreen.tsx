import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  Share,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as MediaLibrary from "expo-media-library";
import Header from "../components/Header";
import ConfirmModal from "../components/ConfirmModal";
import { useTheme } from "../context/ThemeContext";
import { useAttendance } from "../context/AttendanceContext";
import { useAppSettings } from "../context/AppSettingsContext";
import {
  getAttachmentsByEntryId,
  AttachmentRow,
} from "../services/database/repositories/attachments";
import { RootStackParamList } from "../App";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

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
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    if (entry) {
      setAttachments(getAttachmentsByEntryId(entry.id));
    }
  }, [entry?.id]);

  function handleDelete() {
    setDeleteVisible(true);
  }

  async function confirmDelete() {
    if (entry) {
      await deleteEntry(entry.id);
      navigation.goBack();
    }
  }

  async function savePhoto(uri: string) {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Allow photo library access to save photos.");
        return;
      }
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert("Saved", "Photo saved to your gallery.");
    } catch {
      Alert.alert("Error", "Could not save photo.");
    }
  }

  async function sharePhoto(uri: string) {
    try {
      await Share.share(
        Platform.OS === "ios" ? { url: uri } : { message: uri }
      );
    } catch {
      // user cancelled — no-op
    }
  }

  if (!entry) {
    return (
      <View style={[styles.container, { backgroundColor: colors.backgroundAlt }]}>
        <Header title="Attendance Detail" titleIcon="document-text-outline" onBack={() => navigation.goBack()} />
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
    <View style={[styles.container, { backgroundColor: colors.backgroundAlt }]}>
      <Header
        title="Attendance Detail"
        titleIcon="document-text-outline"
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={22} color={colors.red} />
          </TouchableOpacity>
        }
      />

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

        {attachments.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, padding: 14 }]}>
            <Text style={[styles.noteLabel, { color: colors.textSecondary, paddingHorizontal: 0, paddingTop: 0 }]}>
              Photos ({attachments.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              {attachments.map((att, idx) => (
                <TouchableOpacity
                  key={att.id}
                  onPress={() => setPhotoIndex(idx)}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: att.file_uri }}
                    style={styles.attachmentThumb}
                    resizeMode="cover"
                    onError={() => {}}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12, borderTopColor: colors.separator }]}>
        <TouchableOpacity
          style={[styles.journalBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigation.navigate("Journal", { entryId: entry.id })}
          activeOpacity={0.8}
        >
          <Ionicons name="journal-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.journalBtnText, { color: colors.primary }]}>
            {entry.note || attachments.length > 0 ? "Edit Journal / Photos" : "Add Journal Note & Photos"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Delete confirmation modal */}
      <ConfirmModal
        visible={deleteVisible}
        title="Delete Entry"
        message="Are you sure you want to delete this attendance entry? This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteVisible(false)}
      />

      {/* Fullscreen photo viewer */}
      <Modal
        visible={photoIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoIndex(null)}
        statusBarTranslucent
      >
        <View style={styles.photoViewer}>
          {/* close button */}
          <TouchableOpacity
            style={[styles.viewerBtn, styles.viewerClose]}
            onPress={() => setPhotoIndex(null)}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          {photoIndex !== null && (
            <>
              <Image
                source={{ uri: attachments[photoIndex]?.file_uri }}
                style={styles.viewerImage}
                resizeMode="contain"
                onError={() => {}}
              />

              {/* counter */}
              {attachments.length > 1 && (
                <Text style={styles.viewerCounter}>
                  {photoIndex + 1} / {attachments.length}
                </Text>
              )}

              {/* prev / next arrows */}
              {photoIndex > 0 && (
                <TouchableOpacity
                  style={[styles.viewerBtn, styles.viewerPrev]}
                  onPress={() => setPhotoIndex((i) => (i != null ? i - 1 : 0))}
                >
                  <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
              )}
              {photoIndex < attachments.length - 1 && (
                <TouchableOpacity
                  style={[styles.viewerBtn, styles.viewerNext]}
                  onPress={() => setPhotoIndex((i) => (i != null ? i + 1 : 0))}
                >
                  <Ionicons name="chevron-forward" size={28} color="#fff" />
                </TouchableOpacity>
              )}

              {/* save + share action bar */}
              <View style={[styles.viewerActions, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                  style={styles.viewerActionBtn}
                  onPress={() => savePhoto(attachments[photoIndex!].file_uri)}
                >
                  <Ionicons name="download-outline" size={22} color="#fff" />
                  <Text style={styles.viewerActionLabel}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.viewerActionBtn}
                  onPress={() => sharePhoto(attachments[photoIndex!].file_uri)}
                >
                  <Ionicons name="share-outline" size={22} color="#fff" />
                  <Text style={styles.viewerActionLabel}>Share</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { textAlign: "center", marginTop: 40, fontSize: 16 },
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
  attachmentThumb: { width: 110, height: 110, borderRadius: 10, marginRight: 10 },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  journalBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 14, height: 52, borderWidth: 1 },
  journalBtnText: { fontSize: 15, fontWeight: "700" },
  // Photo viewer
  photoViewer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerImage: {
    width: SCREEN_W,
    height: SCREEN_H * 0.72,
  },
  viewerCounter: {
    position: "absolute",
    top: 56,
    alignSelf: "center",
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    fontWeight: "600",
  },
  viewerBtn: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  viewerClose: { top: 48, right: 16 },
  viewerPrev: { left: 12, top: "42%" },
  viewerNext: { right: 12, top: "42%" },
  viewerActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
    paddingTop: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  viewerActionBtn: { alignItems: "center", gap: 4 },
  viewerActionLabel: { color: "#fff", fontSize: 12, fontWeight: "600" },
});
