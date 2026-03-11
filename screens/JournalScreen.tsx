import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import Header from "../components/Header";
import ConfirmModal from "../components/ConfirmModal";
import { useTheme } from "../context/ThemeContext";
import { useAttendance } from "../context/AttendanceContext";
import { useAuth } from "../context/AuthContext";
import {
  getAttachmentsByEntryId,
  insertAttachment,
  softDeleteAttachment,
  AttachmentRow,
} from "../services/database/repositories/attachments";
import { generateId } from "../utils/generateId";
import { RootStackParamList } from "../App";

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RoutePropType = RouteProp<RootStackParamList, "Journal">;

const MAX_ATTACHMENTS = 3;

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { entries, updateEntry } = useAttendance();
  const { user } = useAuth();
  const entry = entries.find((e) => e.id === route.params.entryId);

  const [note, setNote] = useState(entry?.note ?? "");
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

  // Load existing attachments for this entry
  useEffect(() => {
    if (entry) {
      setAttachments(getAttachmentsByEntryId(entry.id));
    }
  }, [entry?.id]);

  async function pickImage() {
    if (attachments.length >= MAX_ATTACHMENTS) {
      const { Alert } = await import("react-native");
      Alert.alert("Limit reached", `You can attach up to ${MAX_ATTACHMENTS} photos per entry.`);
      return;
    }

    if (!entry) {
      const { Alert } = await import("react-native");
      Alert.alert("Error", "No attendance entry found. Please try again.");
      return;
    }
    if (!user) {
      const { Alert } = await import("react-native");
      Alert.alert("Sign-in required", "Please sign in to attach photos.");
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        const { Alert } = await import("react-native");
        Alert.alert("Permission required", "Please allow access to your photo library in Settings.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.85,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets || !result.assets.length) return;

      const asset = result.assets[0];
      if (!asset.uri) return;

      // Copy from ephemeral ImagePicker cache into persistent app storage
      const id = generateId();
      const rawExt = asset.fileName?.split(".").pop()?.toLowerCase() ?? "jpg";
      const ext = /^(jpg|jpeg|png|gif|webp|heic|heif)$/.test(rawExt) ? rawExt : "jpg";
      const destDir = `${FileSystem.documentDirectory}attachments/`;
      await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
      const destUri = `${destDir}${id}.${ext}`;
      await FileSystem.copyAsync({ from: asset.uri, to: destUri });

      // Verify the file actually exists after copy before writing to DB
      const info = await FileSystem.getInfoAsync(destUri);
      if (!info.exists) throw new Error("File copy failed — destination not found.");

      const newAttachment: Omit<AttachmentRow, "created_at" | "synced" | "deleted"> = {
        id,
        entry_id: entry.id,
        user_id: user.id,
        file_uri: destUri,
        remote_path: null,
        display_name: asset.fileName ?? null,
      };
      insertAttachment(newAttachment);
      // Refresh from DB to confirm insertion, then update local state
      setAttachments(getAttachmentsByEntryId(entry.id));
    } catch (err: any) {
      const { Alert } = await import("react-native");
      Alert.alert("Could not add photo", err?.message ?? "An unexpected error occurred. Please try again.");
    }
  }

  function removeAttachment(id: string) {
    setRemoveTarget(id);
  }

  async function handleSave() {
    if (!entry) return;
    setSaving(true);
    try {
      await updateEntry(entry.id, { note: note.trim() || null });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.container, { backgroundColor: colors.backgroundAlt }]}>
        <Header title="Journal" titleIcon="journal-outline" onBack={() => navigation.goBack()} />

        <ScrollView
          contentContainerStyle={[styles.inner, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {entry && (
            <Text style={[styles.dateLine, { color: colors.textSecondary }]}>
              {new Date(entry.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </Text>
          )}

          <View style={[styles.noteCard, { backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.noteInput, { color: colors.text }]}
              value={note}
              onChangeText={setNote}
              placeholder="Write your journal note here..."
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
              autoFocus
            />
          </View>

          {/* Photo attachments section */}
          <View style={styles.photosSection}>
            <View style={styles.photosHeader}>
              <Text style={[styles.photosLabel, { color: colors.text }]}>
                Photos{attachments.length > 0 ? ` (${attachments.length}/${MAX_ATTACHMENTS})` : ""}
              </Text>
              {attachments.length < MAX_ATTACHMENTS && (
                <TouchableOpacity
                  style={[styles.addPhotoBtn, { backgroundColor: colors.primaryDim, borderColor: colors.primary }]}
                  onPress={pickImage}
                  activeOpacity={0.75}
                >
                  <Ionicons name="image-outline" size={16} color={colors.primary} />
                  <Text style={[styles.addPhotoBtnText, { color: colors.primary }]}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            {attachments.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailRow}>
                {attachments.map((att) => (
                  <View key={att.id} style={styles.thumbWrap}>
                    {brokenImages.has(att.id) ? (
                      <View style={[styles.thumbnail, styles.brokenThumbnail]}>
                        <Ionicons name="image-outline" size={22} color="rgba(255,255,255,0.3)" />
                      </View>
                    ) : (
                      <Image
                        source={{ uri: att.file_uri }}
                        style={styles.thumbnail}
                        resizeMode="cover"
                        onError={() => setBrokenImages((prev) => new Set(prev).add(att.id))}
                      />
                    )}
                    <TouchableOpacity
                      style={[styles.removeBtn, { backgroundColor: colors.red }]}
                      onPress={() => removeAttachment(att.id)}
                      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                    >
                      <Ionicons name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <TouchableOpacity
                style={[styles.emptyPhotoArea, { borderColor: colors.border, backgroundColor: colors.card }]}
                onPress={pickImage}
                activeOpacity={0.7}
              >
                <Ionicons name="camera-outline" size={28} color={colors.textMuted} />
                <Text style={[styles.emptyPhotoText, { color: colors.textMuted }]}>
                  Tap to attach a photo (optional)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12, borderTopColor: colors.separator }]}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: saving ? colors.primaryDim : colors.primary }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save"}</Text>
          </TouchableOpacity>
        </View>

        <ConfirmModal
          visible={removeTarget !== null}
          title="Remove Photo"
          message="Remove this photo from the journal entry?"
          confirmLabel="Remove"
          destructive
          onConfirm={() => {
            if (removeTarget) {
              softDeleteAttachment(removeTarget);
              setAttachments((prev) => prev.filter((a) => a.id !== removeTarget));
            }
            setRemoveTarget(null);
          }}
          onCancel={() => setRemoveTarget(null)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { paddingHorizontal: 16 },
  dateLine: { fontSize: 14, marginBottom: 12 },
  noteCard: { borderRadius: 16, padding: 16, minHeight: 220, marginBottom: 20 },
  noteInput: { fontSize: 15, lineHeight: 24, minHeight: 200 },
  photosSection: { marginBottom: 16 },
  photosHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  photosLabel: { fontSize: 15, fontWeight: "700" },
  addPhotoBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  addPhotoBtnText: { fontSize: 13, fontWeight: "600" },
  thumbnailRow: { flexDirection: "row" },
  thumbWrap: { position: "relative", marginRight: 10 },
  thumbnail: { width: 100, height: 100, borderRadius: 12 },
  brokenThumbnail: { backgroundColor: "rgba(255,255,255,0.08)", justifyContent: "center", alignItems: "center" },
  removeBtn: { position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  emptyPhotoArea: { borderWidth: 1.5, borderStyle: "dashed", borderRadius: 16, height: 90, justifyContent: "center", alignItems: "center", gap: 6 },
  emptyPhotoText: { fontSize: 13 },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  saveBtn: { borderRadius: 14, height: 52, justifyContent: "center", alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
