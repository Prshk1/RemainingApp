import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SettingsRow from "../components/SettingsRow";
import { colors } from "../theme/colors";

/**
 * Settings screen — matches Figma settings design.
 * Three grouped sections: Internship Goals, App Preferences, Calculation Mode.
 */
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [darkMode, setDarkMode] = useState(true);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Page title */}
      <Text style={styles.pageTitle}>Settings</Text>

      {/* Section: Internship Goals */}
      <Text style={styles.sectionTitle}>Internship Goals</Text>
      <View style={styles.section}>
        <SettingsRow type="chevron" label="Required Hours" value="400 hrs" />
        <SettingsRow type="chevron" label="Max Per Day" value="8 hrs" />
      </View>

      {/* Section: App Preferences */}
      <Text style={styles.sectionTitle}>App Preferences</Text>
      <View style={styles.section}>
        <SettingsRow
          type="toggle"
          label="Dark Mode"
          value={darkMode}
          onToggle={setDarkMode}
        />
        <SettingsRow type="chevron" label="Time Format" value="12-hour" />
      </View>

      {/* Section: Calculation Mode */}
      <Text style={styles.sectionTitle}>Calculation Mode</Text>
      <View style={styles.section}>
        <SettingsRow type="chevron" label="Count Days" value="Business Days" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 28,
    marginTop: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 4,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 14,
    marginBottom: 28,
    overflow: "hidden",
  },
});