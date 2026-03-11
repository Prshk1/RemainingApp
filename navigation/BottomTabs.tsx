import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

import DashboardScreen from "../screens/DashboardScreen";
import AttendanceScreen from "../screens/AttendanceScreen";
import QRScreen from "../screens/QRScreen";
import BonusScreen from "../screens/BonusScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator();

/** Floating primary action button replacing the center QR tab */
function QRTabButton({ onPress }: { onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.qrButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Ionicons name="qr-code" size={26} color="#fff" />
    </TouchableOpacity>
  );
}

export default function BottomTabs() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const tabBarHeight = Platform.OS === "ios" ? 64 + insets.bottom : 58 + insets.bottom;

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: tabBarHeight,
          paddingBottom: insets.bottom + 4,
          paddingTop: 8,
          // Needed so the floated QR button isn't clipped
          overflow: "visible",
          elevation: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="QR Code"
        component={QRScreen}
        options={{
          tabBarIcon: () => null,
          tabBarLabel: () => null,
          tabBarButton: (props) => (
            <QRTabButton onPress={props.onPress as () => void} />
          ),
        }}
      />
      <Tab.Screen
        name="Bonus"
        component={BonusScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="star" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  qrButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: "center",
    alignItems: "center",
    // Float above the tab bar
    marginBottom: Platform.OS === "ios" ? 24 : 16,
    // Shadow
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 14,
  },
});
