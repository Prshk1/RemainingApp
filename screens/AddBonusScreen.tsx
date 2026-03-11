import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../context/ThemeContext";
import { useBonus, BonusEntry } from "../context/BonusContext";
import Header from "../components/Header";
import ConfirmModal from "../components/ConfirmModal";
import InputModal from "../components/InputModal";
import { getBonusById } from "../services/database/repositories/bonus";
import { RootStackParamList } from "../App";

type NavProp = NativeStackNavigationProp<RootStackParamList, "AddBonus">;
type RoutePropType = RouteProp<RootStackParamList, "AddBonus">;

export default function AddBonusScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { addBonus, updateBonus, deleteBonus } = useBonus();

  const editId = route.params?.bonusId;
  const isEdit = Boolean(editId);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [hours, setHours] = useState("");
  const [note, setNote] = useState("");
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [errorModal, setErrorModal] = useState<{ title: string; msg: string } | null>(null);

  useEffect(() => {
    if (editId) {
      const row = getBonusById(editId);
      if (row) {
        setTitle(row.title);
        setDate(row.date);
        setHours(String(row.hours));
        setNote(row.note ?? "");
      }
    }
  }, [editId]);

  const styles = makeStyles(colors, insets);

  const handleSave = async () => {
    const parsedHours = parseFloat(hours);
    if (!title.trim()) {
      setErrorModal({ title: "Missing title", msg: "Please enter what this bonus is for." });
      return;
    }
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setErrorModal({ title: "Invalid date", msg: "Use YYYY-MM-DD format (e.g. 2026-03-11)." });
      return;
    }
    if (isNaN(parsedHours) || parsedHours <= 0) {
      setErrorModal({ title: "Invalid hours", msg: "Enter a positive number of hours." });
      return;
    }

    if (isEdit && editId) {
      await updateBonus(editId, {
        title: title.trim(),
        date,
        hours: parsedHours,
        note: note.trim() || null,
      });
    } else {
      await addBonus({
        title: title.trim(),
        date,
        hours: parsedHours,
        status: "Approved", // Self-use app: no admin approval needed
        note: note.trim() || null,
      });
    }
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <Header
          title={isEdit ? "Edit Bonus" : "Add Bonus Hours"}
          titleIcon={isEdit ? "create-outline" : "star-outline"}
          onBack={() => navigation.goBack()}
          rightElement={isEdit ? (
            <TouchableOpacity
              onPress={() => setDeleteVisible(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={22} color={colors.red} />
            </TouchableOpacity>
          ) : undefined}
        />

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.inputBox}
            placeholder="e.g. Leadership Seminar"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.inputBox}
            placeholder="2026-03-11"
            placeholderTextColor={colors.textMuted}
            value={date}
            onChangeText={setDate}
          />

          <Text style={styles.label}>Hours Earned</Text>
          <TextInput
            style={styles.inputBox}
            placeholder="e.g. 4.0"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            value={hours}
            onChangeText={setHours}
          />

          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            style={[styles.inputBox, styles.textArea]}
            placeholder="Add details about this bonus..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={note}
            onChangeText={setNote}
          />

          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
            <Text style={styles.infoText}>
              Bonus hours are <Text style={{ fontWeight: "700" }}>automatically approved</Text> and count toward your total immediately.
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Ionicons name="checkmark" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.saveBtnText}>
              {isEdit ? "Save Changes" : "Add Bonus Entry"}
            </Text>
          </TouchableOpacity>
        </View>

        <ConfirmModal
          visible={deleteVisible}
          title="Delete Bonus"
          message="Are you sure you want to delete this bonus entry?"
          confirmLabel="Delete"
          destructive
          onConfirm={() => {
            setDeleteVisible(false);
            if (editId) deleteBonus(editId);
            navigation.goBack();
          }}
          onCancel={() => setDeleteVisible(false)}
        />
        <ConfirmModal
          visible={errorModal !== null}
          title={errorModal?.title ?? ""}
          message={errorModal?.msg}
          confirmLabel="OK"
          cancelLabel="OK"
          onConfirm={() => setErrorModal(null)}
          onCancel={() => setErrorModal(null)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"], insets: { top: number; bottom: number }) {
  return StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 20, paddingBottom: 14, backgroundColor: colors.background,
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator,
    },
    headerTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
    content: { paddingHorizontal: 20, paddingBottom: 20 },
    label: { color: colors.text, fontSize: 14, fontWeight: "600", marginTop: 20, marginBottom: 8 },
    inputBox: {
      backgroundColor: colors.card, borderRadius: 12,
      paddingHorizontal: 16, height: 52,
      color: colors.text, fontSize: 16,
      borderWidth: 1, borderColor: colors.border,
    },
    textArea: { height: 110, paddingTop: 14 },
    infoCard: {
      flexDirection: "row", alignItems: "flex-start",
      backgroundColor: colors.cardAlt, borderRadius: 12,
      padding: 14, marginTop: 20,
    },
    infoText: { flex: 1, color: colors.textMuted, fontSize: 13, lineHeight: 18 },
    footer: {
      paddingHorizontal: 20, paddingTop: 12,
      backgroundColor: colors.background,
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator,
    },
    saveBtn: {
      backgroundColor: colors.primary, borderRadius: 14,
      height: 54, flexDirection: "row",
      justifyContent: "center", alignItems: "center",
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
    },
    saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  });
}
