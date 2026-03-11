import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { AppSettingsProvider } from "./context/AppSettingsContext";
import { NotificationStack } from "./components/NotificationStack";
import { TimerProvider } from "./context/TimerContext";
import { AttendanceProvider } from "./context/AttendanceContext";
import { BonusProvider } from "./context/BonusContext";
import { initDB } from "./services/database/db";
import { getGoals } from "./services/database/repositories/goals";

import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import SetGoalsScreen from "./screens/SetGoalsScreen";
import BottomTabs from "./navigation/BottomTabs";
import ManualEntryScreen from "./screens/ManualEntryScreen";
import AddBonusScreen from "./screens/AddBonusScreen";
import AttendanceDetailScreen from "./screens/AttendanceDetailScreen";
import JournalScreen from "./screens/JournalScreen";

// Initialise SQLite at module load — synchronous, no async needed
initDB();

export type RootStackParamList = {
  // Auth
  Login: undefined;
  Signup: undefined;
  // Setup
  Onboarding: undefined;
  SetGoals: undefined;
  // App
  MainTabs: undefined;
  // Root-level modals (accessible from any tab)
  ManualEntry: undefined;
  AddBonus: { bonusId?: string } | undefined;
  AttendanceDetail: { entryId: string };
  Journal: { entryId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Loading splash while auth state resolves */
function LoadingScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

/** Inner navigator — rendered only after auth state is known */
function AppNavigator() {
  const { session, isLoading } = useAuth();
  const { user } = useAuth();
  const [checkedGoals, setCheckedGoals] = useState(false);
  const [hasGoals, setHasGoals] = useState(false);

  useEffect(() => {
    if (user && !checkedGoals) {
      const goals = getGoals(user.id);
      setHasGoals(goals !== null);
      setCheckedGoals(true);
    }
  }, [user, checkedGoals]);

  if (isLoading || (session && !checkedGoals)) {
    return <LoadingScreen />;
  }

  if (!session) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <AppSettingsProvider>
      <TimerProvider>
        <AttendanceProvider>
          <BonusProvider>
            <Stack.Navigator
              screenOptions={{ headerShown: false }}
              initialRouteName={hasGoals ? "MainTabs" : "Onboarding"}
            >
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
              <Stack.Screen name="SetGoals" component={SetGoalsScreen} />
              <Stack.Screen name="MainTabs" component={BottomTabs} />
              {/* Root-level modals sit above the tab bar */}
              <Stack.Screen
                name="ManualEntry"
                component={ManualEntryScreen}
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="AddBonus"
                component={AddBonusScreen}
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="AttendanceDetail"
                component={AttendanceDetailScreen}
                options={{ presentation: "card" }}
              />
              <Stack.Screen
                name="Journal"
                component={JournalScreen}
                options={{ presentation: "card" }}
              />
            </Stack.Navigator>
          </BonusProvider>
        </AttendanceProvider>
      </TimerProvider>
    </AppSettingsProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
            <NotificationStack />
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}