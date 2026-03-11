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
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { colors } from "../theme/colors";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Onboarding">;
};

const { width } = Dimensions.get("window");
const LOGO_SIZE = width * 0.62;

/**
 * Onboarding splash screen — uses the Remaining Logo asset.
 * Logo image, app title, subtitle, page dots, Get Started CTA.
 */
export default function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
      {/* Remaining Logo */}
      <Image
        source={require("../assets/Remaining Logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Title */}
      <Text style={styles.title}>Remaining</Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Track your internship hours effortlessly{"\n"}and focus on your professional growth.
      </Text>

      {/* Page indicator — 4 dots, first is active/wide */}
      <View style={styles.dotsRow}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      {/* CTA button */}
      <TouchableOpacity
        style={styles.button}
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
    backgroundColor: colors.background,
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
    color: colors.text,
    fontSize: 38,
    fontWeight: "800",
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    color: colors.textSecondary,
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
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 28,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  button: {
    width: "100%",
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
