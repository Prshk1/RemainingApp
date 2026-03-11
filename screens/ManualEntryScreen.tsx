import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Header from "../components/Header";
import { colors } from "../theme/colors";
import { DashboardStackParamList } from "../navigation/BottomTabs";

type Props = {
  navigation: NativeStackNavigationProp<DashboardStackParamList, "ManualEntry">;
};

const TOTAL_HOURS = 7.0;
const MAX_HOURS = 8;

/**
 * Manual Entry screen — matches Figma manual entry design.
 * Date, time in/out inputs, break deduction toggle, hours progress bar, save button.
 */
export default function ManualEntryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState("");
  const [timeIn, setTimeIn] = useState("09:00 AM");
  const [timeOut, setTimeOut] = useState("05:00 PM");
  const [deductBreak, setDeductBreak] = useState(true);

  const barWidth = Math.min((TOTAL_HOURS / MAX_HOURS) * 100, 100);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      // Header handles its own safe-area top padding
      <View style={styles.container}>
        <Header title="Manual Entry" onBack={() => navigation.goBack()} />

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
              placeholder="mm/dd/yyyy"
              placeholderTextColor={colors.textMuted}
              value={date}
              onChangeText={setDate}
            />
          </View>

          {/* Time In field */}
          <Text style={styles.fieldLabel}>Time In</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={timeIn}
              onChangeText={setTimeIn}
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Time Out field */}
          <Text style={styles.fieldLabel}>Time Out</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={timeOut}
              onChangeText={setTimeOut}
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Deduct Break Time row */}
          <View style={styles.breakRow}>
            <View style={styles.breakIcon}>
              <Ionicons name="cafe-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.breakText}>
              <Text style={styles.breakTitle}>Deduct Break Time</Text>
              <Text style={styles.breakSub}>Automatically subtract 1 hour</Text>
            </View>
            <Switch
              value={deductBreak}
              onValueChange={setDeductBreak}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.text}
            />
          </View>

          {/* Total Hours preview card */}
          <View style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Hours</Text>
              <Text style={styles.totalValue}>{TOTAL_HOURS.toFixed(1)} hrs</Text>
            </View>
            {/* Progress bar */}
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${barWidth}%` }]} />
            </View>
          </View>
        </ScrollView>

        {/* Save Entry button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85}>
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
  input: {
    color: colors.text,
    fontSize: 16,
  },

  breakRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    gap: 12,
  },
  breakIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primaryDim,
    justifyContent: "center",
    alignItems: "center",
  },
  breakText: { flex: 1 },
  breakTitle: { color: colors.text, fontSize: 15, fontWeight: "600" },
  breakSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },

  totalCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 18,
    marginTop: 20,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  totalLabel: { color: colors.textSecondary, fontSize: 14 },
  totalValue: { color: colors.primary, fontSize: 18, fontWeight: "700" },
  barTrack: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 4,
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.background,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  saveBtnText: { color: colors.text, fontSize: 17, fontWeight: "700" },
});
