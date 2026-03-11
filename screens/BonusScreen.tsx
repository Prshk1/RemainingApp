import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import Header from "../components/Header";
import BonusItem from "../components/BonusItem";
import { colors } from "../theme/colors";
import { bonusEntries } from "../data/placeholders";

/**
 * Bonus Hours screen — matches Figma bonus design.
 * Summary card with total + monthly badge, recent history list.
 */
export default function BonusScreen() {
  const totalBonus = bonusEntries.reduce((sum, e) => sum + e.hours, 0);

  return (
    // Header handles its own safe-area top padding
    <View style={styles.container}>
      <Header title="Bonus Hours" rightIcon="filter" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Summary card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Bonus Hours Earned</Text>
          <Text style={styles.summaryValue}>{totalBonus.toFixed(1)}</Text>
          <View style={styles.monthBadge}>
            <Text style={styles.monthBadgeText}>+4.0 this month</Text>
          </View>
        </View>

        {/* Recent history */}
        <Text style={styles.sectionTitle}>RECENT HISTORY</Text>
        {bonusEntries.map((entry) => (
          <BonusItem
            key={entry.id}
            iconName={entry.iconName as any}
            title={entry.title}
            date={entry.date}
            status={entry.status}
            hours={entry.hours}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    marginBottom: 28,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  summaryValue: {
    color: colors.primary,
    fontSize: 52,
    fontWeight: "800",
    marginBottom: 12,
  },
  monthBadge: {
    backgroundColor: colors.greenBg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  monthBadgeText: {
    color: colors.greenText,
    fontSize: 13,
    fontWeight: "600",
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 14,
  },
});