import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Header from "../components/Header";
import { TAB_BAR_HEIGHT } from "../components/CustomTabBar";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNotification } from "../context/NotificationContext";
import { RootStackParamList } from "../App";

type NavProp = NativeStackNavigationProp<RootStackParamList, "Profile">;
type SaveKey = "profile" | "password" | null;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const { colors } = useTheme();
  const { user, updateFullName, updateEmail, updatePassword } = useAuth();
  const { showNotification } = useNotification();

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState<SaveKey>(null);

  const styles = makeStyles(colors);

  useEffect(() => {
    setFullName(user?.fullName ?? "");
    setEmail(user?.email ?? "");
  }, [user?.fullName, user?.email]);

  const saveProfile = async () => {
    if (!fullName.trim()) {
      showNotification({
        type: "error",
        title: "Invalid name",
        message: "Name cannot be empty.",
      });
      return;
    }

    if (!email.trim()) {
      showNotification({
        type: "error",
        title: "Invalid email",
        message: "Email cannot be empty.",
      });
      return;
    }

    const normalizedName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const hasNameChange = normalizedName !== (user?.fullName ?? "").trim();
    const hasEmailChange = normalizedEmail !== (user?.email ?? "").trim().toLowerCase();

    if (!hasNameChange && !hasEmailChange) {
      showNotification({
        type: "info",
        title: "No changes",
        message: "Update a field before saving.",
      });
      return;
    }

    setSaving("profile");
    if (hasNameChange) {
      const { error } = await updateFullName(normalizedName);
      if (error) {
        setSaving(null);
        showNotification({ type: "error", title: "Update failed", message: error });
        return;
      }
    }

    let pendingConfirmation = false;
    if (hasEmailChange) {
      const { error, pendingConfirmation: emailPending } = await updateEmail(normalizedEmail);
      if (error) {
        setSaving(null);
        showNotification({ type: "error", title: "Update failed", message: error });
        return;
      }
      pendingConfirmation = emailPending;
    }

    setSaving(null);

    if (pendingConfirmation) {
      showNotification({
        type: "info",
        title: "Email update requested",
        message: "Your provider requires confirmation. Please check your email.",
      });
      return;
    }

    showNotification({
      type: "success",
      title: "Profile updated",
      message: "Your account details were updated.",
    });
  };

  const savePassword = async () => {
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

    setSaving("password");
    const { error } = await updatePassword(password);
    setSaving(null);

    if (error) {
      showNotification({ type: "error", title: "Update failed", message: error });
      return;
    }

    setPassword("");
    setConfirmPassword("");
    showNotification({
      type: "success",
      title: "Password updated",
      message: "Use your new password the next time you sign in.",
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundAlt ?? colors.background }]}> 
      <Header
        title="Profile"
        titleIcon="person-circle-outline"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.inner,
          { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.group, { color: colors.textSecondary }]}>ACCOUNT INFO</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.label, { color: colors.textMuted }]}>Full Name</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your full name"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
            ]}
          />
          <Text style={[styles.label, { color: colors.textMuted, marginTop: 18 }]}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
            ]}
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={saveProfile}
            activeOpacity={0.85}
            disabled={saving === "profile"}
          >
            {saving === "profile" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.group, { color: colors.textSecondary }]}>SECURITY</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.label, { color: colors.textMuted }]}>New Password</Text>
          <View
            style={[
              styles.passwordWrap,
              { borderColor: colors.border, backgroundColor: colors.background },
            ]}
          >
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              style={[styles.input, styles.passwordInput, { color: colors.text }]}
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

          <Text style={[styles.label, { color: colors.textMuted, marginTop: 18 }]}>Confirm Password</Text>
          <View
            style={[
              styles.passwordWrap,
              { borderColor: colors.border, backgroundColor: colors.background },
            ]}
          >
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat new password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              style={[styles.input, styles.passwordInput, { color: colors.text }]}
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
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={savePassword}
            activeOpacity={0.85}
            disabled={saving === "password"}
          >
            {saving === "password" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Change Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: { flex: 1 },
    inner: { paddingHorizontal: 16, paddingTop: 8 },
    group: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1,
      marginTop: 24,
      marginBottom: 8,
      marginLeft: 4,
    },
    card: {
      borderRadius: 14,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    label: {
      fontSize: 12,
      fontWeight: "600",
      marginBottom: 8,
    },
    input: {
      flex: 1,
      paddingHorizontal: 12,
      height: 48,
      fontSize: 15,
    },
    passwordInput: { letterSpacing: 0.4 },
    passwordWrap: {
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      height: 48,
      paddingRight: 10,
    },
    eyeButton: { paddingLeft: 8, height: 28, justifyContent: "center" },
    button: {
      marginTop: 12,
      height: 44,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "700",
    },
  });
}
