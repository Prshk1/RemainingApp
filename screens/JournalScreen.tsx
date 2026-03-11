import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Header from "../components/Header";
import { colors } from "../theme/colors";
import { AttendanceStackParamList } from "../navigation/BottomTabs";

type Props = {
  navigation: NativeStackNavigationProp<AttendanceStackParamList, "Journal">;
};

const { width } = Dimensions.get("window");
const THUMB_SIZE = (width - 56) / 3;

// Placeholder attachment thumbnails — solid color placeholders
const PLACEHOLDER_THUMBS = [colors.card, colors.cardAlt];

/**
 * Edit Journal screen — matches Figma journal edit design.
 * Date input, multiline journal textarea, image attachment section, save button.
 */
export default function JournalScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState("10/24/2023");
  const [entry, setEntry] = useState("");

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      // Header handles its own safe-area top padding
      <View style={styles.container}>
        <Header title="Edit Journal" onBack={() => navigation.goBack()} />

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Date field */}
          <Text style={styles.fieldLabel}>Date</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Journal Entry textarea */}
          <Text style={styles.fieldLabel}>Journal Entry</Text>
          <View style={styles.textAreaBox}>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              placeholder="Write down your tasks, learnings, and experiences today..."
              placeholderTextColor={colors.textMuted}
              value={entry}
              onChangeText={setEntry}
            />
          </View>

          {/* Attachments */}
          <Text style={styles.sectionTitle}>Attachments</Text>

          {/* Dashed upload zone */}
          <TouchableOpacity style={styles.uploadZone} activeOpacity={0.7}>
            <View style={styles.uploadIconCircle}>
              <Ionicons name="image-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.uploadTitle}>Add Image</Text>
            <Text style={styles.uploadSub}>Tap to upload photos</Text>
          </TouchableOpacity>

          {/* Thumbnail grid (placeholder colored boxes) */}
          <View style={styles.thumbRow}>
            {PLACEHOLDER_THUMBS.map((bg, i) => (
              <View key={i} style={[styles.thumb, { backgroundColor: bg }]} />
            ))}
          </View>
        </ScrollView>

        {/* Save Entry button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85}>
            <Ionicons name="save-outline" size={18} color={colors.text} style={{ marginRight: 8 }} />
            <Text style={styles.saveBtnText}>Save Entry</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 20 },

  fieldLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 16,
  },
  inputBox: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: "center",
  },
  input: { color: colors.text, fontSize: 16 },

  textAreaBox: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    minHeight: 160,
  },
  textArea: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 128,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 12,
  },

  uploadZone: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 32,
    alignItems: "center",
    backgroundColor: colors.primaryDim,
    marginBottom: 16,
  },
  uploadIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.card,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  uploadTitle: { color: colors.text, fontSize: 15, fontWeight: "600", marginBottom: 4 },
  uploadSub: { color: colors.textSecondary, fontSize: 12 },

  thumbRow: { flexDirection: "row", gap: 8 },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
  },

  footer: { paddingHorizontal: 20, paddingTop: 12 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
  },
  saveBtnText: { color: colors.text, fontSize: 17, fontWeight: "700" },
});
