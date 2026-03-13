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
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNotification } from "../context/NotificationContext";
import { RootStackParamList } from "../App";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Signup">;
};

export default function SignupScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { signUpWithEmail } = useAuth();
  const { showNotification } = useNotification();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const styles = makeStyles(colors, insets);

  const handleSignUp = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      showNotification({
        type: "error",
        title: "Missing fields",
        message: "Please fill in all fields.",
      });
      return;
    }
    if (password.length < 8) {
      showNotification({
        type: "error",
        title: "Weak password",
        message: "Password must be at least 8 characters.",
      });
      return;
    }
    if (password !== confirmPassword) {
      showNotification({
        type: "error",
        title: "Password mismatch",
        message: "Passwords do not match.",
      });
      return;
    }
    setLoading(true);
    const { error } = await signUpWithEmail(email, password, fullName);
    setLoading(false);
    if (error) {
      showNotification({
        type: "error",
        title: "Sign-up failed",
        message: error,
      });
    } else {
      showNotification({
        type: "success",
        title: "Account created!",
        message: "Welcome! Let's set up your goals.",
      });
      // Auth state change will automatically switch the navigator to the
      // onboarding flow — no explicit navigation call needed here.
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start tracking your internship journey.</Text>

        {/* Full Name */}
        <Text style={styles.label}>Full Name</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Jane Smith"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password */}
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Min. 8 characters"
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword((p) => !p)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Confirm password */}
        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Repeat password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            returnKeyType="done"
            onSubmitEditing={handleSignUp}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword((p) => !p)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSignUp}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"], insets: { top: number; bottom: number }) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    container: {
      flexGrow: 1, paddingHorizontal: 28,
      paddingTop: insets.top + 20,
      paddingBottom: insets.bottom + 24,
    },
    backBtn: { marginBottom: 24 },
    title: { color: colors.text, fontSize: 28, fontWeight: "800", marginBottom: 8 },
    subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: 28 },
    label: { color: colors.text, fontSize: 14, fontWeight: "600", marginBottom: 8, marginTop: 16 },
    inputWrap: {
      flexDirection: "row", alignItems: "center",
      backgroundColor: colors.card, borderRadius: 14,
      paddingHorizontal: 14, height: 52,
      borderWidth: 1, borderColor: colors.border,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, color: colors.text, fontSize: 16 },
    passwordInput: { letterSpacing: 0.4 },
    eyeButton: { paddingLeft: 10, height: 30, justifyContent: "center" },
    submitBtn: {
      backgroundColor: colors.primary, borderRadius: 14,
      height: 54, justifyContent: "center", alignItems: "center",
      marginTop: 28,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
    },
    submitBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
    footerRow: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
    footerText: { color: colors.textSecondary, fontSize: 15 },
    footerLink: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  });
}
