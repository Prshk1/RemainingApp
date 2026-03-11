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
  navigation: NativeStackNavigationProp<RootStackParamList, "Login">;
};

export default function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { signInWithEmail } = useAuth();
  const { showNotification } = useNotification();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const styles = makeStyles(colors, insets);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showNotification({
        type: "error",
        title: "Missing fields",
        message: "Please enter your email and password.",
      });
      return;
    }
    setLoading(true);
    const { error } = await signInWithEmail(email, password);
    setLoading(false);
    if (error) {
      showNotification({
        type: "error",
        title: "Login failed",
        message: error,
      });
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
        {/* Logo mark */}
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Ionicons name="time" size={40} color={colors.primary} />
          </View>
        </View>

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue tracking your internship hours.</Text>

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
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword((p) => !p)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Sign In Button */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleLogin}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.submitBtnText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        {/* Social sign-in note */}
        <Text style={styles.socialNote}>
          Google &amp; Apple sign-in require additional native configuration. Set up OAuth providers in your Supabase dashboard, then enable them here.
        </Text>

        {/* Sign Up link */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
            <Text style={styles.footerLink}>Create one</Text>
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
      flexGrow: 1,
      paddingHorizontal: 28,
      paddingTop: insets.top + 40,
      paddingBottom: insets.bottom + 24,
    },
    logoWrap: { alignItems: "center", marginBottom: 32 },
    logoCircle: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: colors.primaryDim,
      justifyContent: "center", alignItems: "center",
    },
    title: { color: colors.text, fontSize: 28, fontWeight: "800", textAlign: "center", marginBottom: 8 },
    subtitle: { color: colors.textSecondary, fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 36 },
    label: { color: colors.text, fontSize: 14, fontWeight: "600", marginBottom: 8, marginTop: 16 },
    inputWrap: {
      flexDirection: "row", alignItems: "center",
      backgroundColor: colors.card, borderRadius: 14,
      paddingHorizontal: 14, height: 52,
      borderWidth: 1, borderColor: colors.border,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, color: colors.text, fontSize: 16 },
    submitBtn: {
      backgroundColor: colors.primary, borderRadius: 14,
      height: 54, justifyContent: "center", alignItems: "center",
      marginTop: 28,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
    },
    submitBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
    dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 24, gap: 12 },
    divider: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
    socialNote: {
      color: colors.textMuted, fontSize: 12, textAlign: "center",
      lineHeight: 18, marginBottom: 24,
    },
    footerRow: { flexDirection: "row", justifyContent: "center", marginTop: 8 },
    footerText: { color: colors.textSecondary, fontSize: 15 },
    footerLink: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  });
}
