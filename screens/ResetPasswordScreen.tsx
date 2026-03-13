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
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNotification } from "../context/NotificationContext";
import { RootStackParamList } from "../App";
import { supabase } from "../services/supabase/client";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ResetPassword">;
};

function readRecoveryTokens(url: string) {
  const hashPart = url.includes("#") ? url.split("#")[1] : "";
  const queryPart = url.includes("?") ? url.split("?")[1].split("#")[0] : "";

  const hash = new URLSearchParams(hashPart);
  const query = new URLSearchParams(queryPart);

  const accessToken = hash.get("access_token") ?? query.get("access_token");
  const refreshToken = hash.get("refresh_token") ?? query.get("refresh_token");
  const type = hash.get("type") ?? query.get("type");

  return {
    accessToken,
    refreshToken,
    isRecovery: type === "recovery",
  };
}

export default function ResetPasswordScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { updatePassword, signOut } = useAuth();
  const { showNotification } = useNotification();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const styles = makeStyles(colors, insets);

  useEffect(() => {
    const hydrateRecoverySession = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (!initialUrl) {
        setLinkError("Missing recovery link. Request a new password reset email.");
        setIsReady(false);
        return;
      }

      const { accessToken, refreshToken, isRecovery } = readRecoveryTokens(initialUrl);
      if (!isRecovery || !accessToken || !refreshToken) {
        setLinkError("Invalid or expired recovery link. Request a new password reset email.");
        setIsReady(false);
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        setLinkError(error.message);
        setIsReady(false);
        return;
      }

      setLinkError(null);
      setIsReady(true);
    };

    void hydrateRecoverySession();
  }, []);

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      showNotification({
        type: "error",
        title: "Missing fields",
        message: "Please enter and confirm your new password.",
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
    const { error } = await updatePassword(password);
    setLoading(false);

    if (error) {
      showNotification({
        type: "error",
        title: "Reset failed",
        message: error,
      });
      return;
    }

    await signOut();
    showNotification({
      type: "success",
      title: "Password updated",
      message: "You can now sign in with your new password.",
    });
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Set your new password to finish account recovery.
        </Text>

        {linkError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{linkError}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>New Password</Text>
        <View style={styles.inputWrap}>
          <Ionicons
            name="lock-closed-outline"
            size={18}
            color={colors.textMuted}
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="At least 8 characters"
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
            value={password}
            onChangeText={setPassword}
            editable={isReady}
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

        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.inputWrap}>
          <Ionicons
            name="lock-closed-outline"
            size={18}
            color={colors.textMuted}
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Repeat new password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={isReady}
            returnKeyType="done"
            onSubmitEditing={handleReset}
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
          style={[styles.submitBtn, !isReady && styles.submitBtnDisabled]}
          onPress={handleReset}
          activeOpacity={0.85}
          disabled={loading || !isReady}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  insets: { top: number; bottom: number }
) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    container: {
      flexGrow: 1,
      paddingHorizontal: 28,
      paddingTop: insets.top + 20,
      paddingBottom: insets.bottom + 24,
    },
    backBtn: { marginBottom: 24 },
    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: "800",
      marginBottom: 8,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 22,
    },
    errorBox: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.red,
      backgroundColor: `${colors.red}22`,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 10,
    },
    errorText: {
      color: colors.red,
      fontSize: 13,
      lineHeight: 18,
    },
    label: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 8,
      marginTop: 16,
    },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 14,
      paddingHorizontal: 14,
      height: 52,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, color: colors.text, fontSize: 16 },
    passwordInput: { letterSpacing: 0.4 },
    eyeButton: { paddingLeft: 10, height: 30, justifyContent: "center" },
    submitBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      height: 54,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 28,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 6,
    },
    submitBtnDisabled: {
      opacity: 0.55,
    },
    submitBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  });
}
