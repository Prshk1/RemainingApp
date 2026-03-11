import React from "react";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

// Screens — tab roots
import DashboardScreen from "../screens/DashboardScreen";
import AttendanceScreen from "../screens/AttendanceScreen";
import QRScreen from "../screens/QRScreen";
import BonusScreen from "../screens/BonusScreen";
import SettingsScreen from "../screens/SettingsScreen";

// Nested screens
import ManualEntryScreen from "../screens/ManualEntryScreen";
import AttendanceDetailScreen from "../screens/AttendanceDetailScreen";
import JournalScreen from "../screens/JournalScreen";

// ─── Stack Param Lists ───────────────────────────────────────────────────────

export type DashboardStackParamList = {
  DashboardMain: undefined;
  ManualEntry: undefined;
};

export type AttendanceStackParamList = {
  AttendanceMain: undefined;
  AttendanceDetail: undefined;
  Journal: undefined;
};

const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();
const AttendanceStack = createNativeStackNavigator<AttendanceStackParamList>();

// ─── Nested Stacks ───────────────────────────────────────────────────────────

function DashboardStackScreen() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="DashboardMain" component={DashboardScreen} />
      <DashboardStack.Screen name="ManualEntry" component={ManualEntryScreen} />
    </DashboardStack.Navigator>
  );
}

function AttendanceStackScreen() {
  return (
    <AttendanceStack.Navigator screenOptions={{ headerShown: false }}>
      <AttendanceStack.Screen name="AttendanceMain" component={AttendanceScreen} />
      <AttendanceStack.Screen name="AttendanceDetail" component={AttendanceDetailScreen} />
      <AttendanceStack.Screen name="Journal" component={JournalScreen} />
    </AttendanceStack.Navigator>
  );
}

// ─── Bottom Tabs ─────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

/** Custom elevated center QR button matching the Figma design */
function QRTabButton({ onPress }: { onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.qrButton} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name="qr-code" size={28} color={colors.text} />
    </TouchableOpacity>
  );
}

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceStackScreen}
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
          // Custom raised button replaces the default tab button
          tabBarButton: (props) => <QRTabButton onPress={props.onPress as () => void} />,
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
  tabBar: {
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: Platform.OS === "ios" ? 84 : 64,
    paddingBottom: Platform.OS === "ios" ? 20 : 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  // Raised QR button — sits above the tab bar
  qrButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Platform.OS === "ios" ? 20 : 10,
    // Elevation / shadow
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },
});
