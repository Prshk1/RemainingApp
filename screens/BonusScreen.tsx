import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Header from "../components/Header";
import StatCard from "../components/StatCard";
import BonusItem from "../components/BonusItem";
import { useTheme } from "../context/ThemeContext";
import { useBonus } from "../context/BonusContext";
import { RootStackParamList } from "../App";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function BonusScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const { entries, totalApprovedHours } = useBonus();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Bonus Hours" />
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        ListHeaderComponent={
          <>
            <View style={styles.statRow}>
              <StatCard label={"Total Approved\nBonus Hours"} value={parseFloat(totalApprovedHours.toFixed(1))} unit="hrs" />
              <StatCard label={"Bonus\nEntries"} value={entries.length} unit="items" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Bonus List</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="star-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No bonus entries yet</Text>
            <Text style={[styles.emptySubText, { color: colors.textMuted }]}>Tap + to add bonus hours</Text>
          </View>
        }
        renderItem={({ item }) => (
          <BonusItem
            title={item.title}
            date={item.date}
            hours={item.hours}
            status={item.status as "Pending" | "Approved" | "Rejected"}
            onPress={() => navigation.navigate("AddBonus", { bonusId: item.id })}
          />
        )}
      />
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20, backgroundColor: colors.primary }]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate("AddBonus")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 16 },
  statRow: { flexDirection: "row", marginBottom: 24, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 14 },
  emptyWrap: { alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: 16, fontWeight: "600", marginTop: 12 },
  emptySubText: { fontSize: 13, marginTop: 4 },
  fab: { position: "absolute", right: 20, width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center", elevation: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6 },
});
