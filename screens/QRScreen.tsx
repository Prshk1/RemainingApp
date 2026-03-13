import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect } from "@react-navigation/native";
import Header from "../components/Header";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useSync } from "../context/SyncContext";
import { getQRImage, upsertQRImage } from "../services/database/repositories/qr";
import { generateId } from "../utils/generateId";

export default function QRScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { requestSync } = useSync();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function loadQRImage() {
    if (user) {
      const row = getQRImage(user.id);
      if (row?.local_uri) setImageUri(row.local_uri);
      else setImageUri(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadQRImage();
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      loadQRImage();
    }, [user?.id])
  );

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      const sourceUri = result.assets[0].uri;
      const ext = (result.assets[0].fileName?.split(".").pop() || "png").toLowerCase();
      const safeExt = /^(jpg|jpeg|png|gif|webp|heic|heif)$/.test(ext) ? ext : "png";
      const qrDir = `${FileSystem.documentDirectory}qr/`;
      await FileSystem.makeDirectoryAsync(qrDir, { intermediates: true });
      const localUri = `${qrDir}${generateId()}.${safeExt}`;
      await FileSystem.copyAsync({ from: sourceUri, to: localUri });

      setImageUri(localUri);
      if (user) {
        upsertQRImage(generateId(), user.id, localUri, null);
        requestSync();
      }
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="QR Code" titleIcon="qr-code-outline" />
      <View style={[styles.content, { paddingBottom: insets.bottom + 80 }]}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : imageUri ? (
          <>
            <View style={[styles.imageWrap, { backgroundColor: colors.card }]}>
              <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
            </View>
            <TouchableOpacity style={[styles.changeBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={pickImage} activeOpacity={0.8}>
              <Ionicons name="image-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.changeBtnText, { color: colors.primary }]}>Change Image</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={[styles.placeholder, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="qr-code-outline" size={72} color={colors.textMuted} />
              <Text style={[styles.placeholderTitle, { color: colors.text }]}>No QR Code</Text>
              <Text style={[styles.placeholderSubtitle, { color: colors.textSecondary }]}>Upload a QR code image from your gallery to display it here</Text>
            </View>
            <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: colors.primary }]} onPress={pickImage} activeOpacity={0.85}>
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.uploadBtnText}>Upload QR Image</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  imageWrap: { borderRadius: 20, padding: 16, marginBottom: 20, width: 280, height: 280, justifyContent: "center", alignItems: "center" },
  image: { width: 248, height: 248, borderRadius: 12 },
  changeBtn: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1 },
  changeBtnText: { fontSize: 15, fontWeight: "600" },
  placeholder: { borderRadius: 20, padding: 32, alignItems: "center", marginBottom: 24, borderWidth: 1, borderStyle: "dashed", width: 280, height: 280, justifyContent: "center" },
  placeholderTitle: { fontSize: 18, fontWeight: "700", marginTop: 16, marginBottom: 8 },
  placeholderSubtitle: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  uploadBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14, width: "100%" },
  uploadBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
