import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { useTheme } from "../context/ThemeContext";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get("window");
const LOGO_SIZE = width * 0.62;

/**
 * Onboarding splash screen — uses the Remaining Logo asset.
 * Logo image, app title, subtitle, page dots, Get Started CTA.
 */
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 20, backgroundColor: colors.background }]}>
      {/* Remaining Logo */}
      <Image
        source={require("../assets/Remaining Logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Title */}
      <Text style={[styles.title, { color: colors.text }]}>Remaining</Text>

      {/* Subtitle */}
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Track your internship hours effortlessly{"\n"}and focus on your professional growth.
      </Text>

      {/* Page indicator — 4 dots, first is active/wide */}
      <View style={styles.dotsRow}>
        <View style={[styles.dot, styles.dotActive, { backgroundColor: colors.primary }]} />
        <View style={[styles.dot, { backgroundColor: colors.border }]} />
        <View style={[styles.dot, { backgroundColor: colors.border }]} />
        <View style={[styles.dot, { backgroundColor: colors.border }]} />
      </View>

      {/* CTA button */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate("SetGoals")}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    marginBottom: 44,
  },
  title: {
    fontSize: 38,
    fontWeight: "800",
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 40,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 48,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 28,
    borderRadius: 4,
  },
  button: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
