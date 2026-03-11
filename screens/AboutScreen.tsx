import React from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";import Header from "../components/Header";import { useTheme } from "../context/ThemeContext";

const APP_VERSION = "1.0.0";
const BUILD_NUMBER = "1";

interface InfoRowProps {
  label: string;
  value: string;
  onPress?: () => void;
  icon?: string;
  colors: ReturnType<typeof useTheme>["colors"];
}

function InfoRow({ label, value, onPress, icon, colors }: InfoRowProps) {
  const content = (
    <View style={[styles.row, { borderBottomColor: colors.separator }]}>
      <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.rowRight}>
        <Text style={[styles.rowValue, { color: onPress ? colors.primary : colors.text }]}>{value}</Text>
        {icon && <Ionicons name={icon as any} size={16} color={onPress ? colors.primary : colors.textMuted} style={{ marginLeft: 4 }} />}
      </View>
    </View>
  );
  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>;
  }
  return content;
}

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundAlt }]}>
      <Header title="About" titleIcon="information-circle-outline" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.inner, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* App identity */}
        <View style={styles.logoSection}>
          <Image
            source={require("../assets/Remaining Logo(BlackBG)-02.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: colors.text }]}>Remaining</Text>
          <Text style={[styles.appTagline, { color: colors.textSecondary }]}>
            Track your internship hours, goals, and journal.
          </Text>
        </View>

        {/* Version info */}
        <Text style={[styles.section, { color: colors.textSecondary }]}>VERSION</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <InfoRow label="Version" value={APP_VERSION} colors={colors} />
          <InfoRow label="Build" value={BUILD_NUMBER} colors={colors} />
        </View>

        {/* Developer */}
        <Text style={[styles.section, { color: colors.textSecondary }]}>DEVELOPER</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <InfoRow label="Made by" value="prshk1" colors={colors} />
          <InfoRow
            label="Contact"
            value="prshk1@github"
            onPress={() => Linking.openURL("https://github.com/prshk1")}
            icon="open-outline"
            colors={colors}
          />
        </View>

        {/* Privacy */}
        <Text style={[styles.section, { color: colors.textSecondary }]}>PRIVACY</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={[styles.privacyRow, { backgroundColor: colors.card }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} style={{ marginRight: 12, marginTop: 2 }} />
            <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
              All your data is stored <Text style={{ color: colors.text, fontWeight: "700" }}>locally on this device</Text>.
              Nothing is sent to any server unless you explicitly enable cloud sync.
              No analytics, no tracking, no third-party data sharing.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { paddingHorizontal: 16 },
  logoSection: { alignItems: "center", paddingVertical: 28 },
  logo: { width: 90, height: 90, marginBottom: 14 },
  appName: { fontSize: 22, fontWeight: "800", marginBottom: 6 },
  appTagline: { fontSize: 13, textAlign: "center", lineHeight: 20, maxWidth: 260 },
  section: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginTop: 24, marginBottom: 8, marginLeft: 4 },
  card: { borderRadius: 14, overflow: "hidden", marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  rowLabel: { fontSize: 14 },
  rowRight: { flexDirection: "row", alignItems: "center" },
  rowValue: { fontSize: 14, fontWeight: "600" },
  privacyRow: { flexDirection: "row", padding: 16, alignItems: "flex-start" },
  privacyText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
