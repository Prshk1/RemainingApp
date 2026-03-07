import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import ProgressRing from "../components/ProgressRing";

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      
    <ProgressRing
      size={220}
      strokeWidth={16}
      progress={0.70}
      label="120h"
    />
      <View style={styles.card}>
        <Text style={styles.label}>Total Hours Logged</Text>
        <Text style={styles.value}>120 hrs</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Days Logged</Text>
        <Text style={styles.value}>24 days</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 20,
  },
  card: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 14,
    marginBottom: 15,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  value: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "bold",
  },
});