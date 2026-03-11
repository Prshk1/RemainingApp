import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import OnboardingScreen from "./screens/OnboardingScreen";
import SetGoalsScreen from "./screens/SetGoalsScreen";
import BottomTabs from "./navigation/BottomTabs";

export type RootStackParamList = {
  Onboarding: undefined;
  SetGoals: undefined;
  MainTabs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="SetGoals" component={SetGoalsScreen} />
          <Stack.Screen name="MainTabs" component={BottomTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}