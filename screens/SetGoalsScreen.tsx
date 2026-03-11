import React, { useState } from "react";
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
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { colors } from "../theme/colors";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "SetGoals">;
};

/**
 * Set Goals onboarding step — matches Figma slide 2.
 * Inputs for total required hours and max hours per day.
 */
export default function SetGoalsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [totalHours, setTotalHours] = useState("");
  const [maxPerDay, setMaxPerDay] = useState("");

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header row with back button and title */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Set Goals</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Page heading */}
        <Text style={styles.heading}>Set Your{"\n"}Internship Goals</Text>
        <Text style={styles.subheading}>
          Enter the total required hours for your internship and the maximum
          hours you can work per day.
        </Text>

        {/* Total Required Hours */}
        <Text style={styles.fieldLabel}>TOTAL REQUIRED HOURS</Text>
        <View style={styles.inputRow}>
          <Ionicons name="time-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g. 300"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={totalHours}
            onChangeText={setTotalHours}
          />
          <Text style={styles.inputUnit}>hrs</Text>
        </View>

        {/* Max Hours Per Day */}
        <Text style={[styles.fieldLabel, { marginTop: 24 }]}>MAX HOURS PER DAY</Text>
        <View style={styles.inputRow}>
          <Ionicons name="calendar-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g. 8"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={maxPerDay}
            onChangeText={setMaxPerDay}
          />
          <Text style={styles.inputUnit}>hrs/day</Text>
        </View>

        <View style={styles.spacer} />

        {/* Page dots — second dot active */}
        <View style={styles.dotsRow}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {/* Next button */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("MainTabs")}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Next  →</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 36,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  heading: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 42,
    marginBottom: 14,
  },
  subheading: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 36,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
  },
  inputUnit: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "500",
  },
  spacer: { flex: 1, minHeight: 40 },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 28,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  buttonText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
});
