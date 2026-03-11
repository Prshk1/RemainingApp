import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Header from "../components/Header";
import { colors } from "../theme/colors";
import { attendanceDetail } from "../data/placeholders";
import { AttendanceStackParamList } from "../navigation/BottomTabs";

type Props = {
  navigation: NativeStackNavigationProp<AttendanceStackParamList, "AttendanceDetail">;
};

/**
 * Attendance Details screen — matches Figma attendance detail design.
 * Large date, time in/out/total/entry-type card, journal preview, action buttons.
 */
export default function AttendanceDetailScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const d = attendanceDetail;

  return (
    // Header handles its own safe-area top padding
    <View style={styles.container}>
      <Header
        title="Attendance Details"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Large date heading */}
        <Text style={styles.dateHeading}>{d.date}</Text>

        {/* Detail card */}
        <View style={styles.detailCard}>
          <DetailRow label="Time In" value={d.timeIn} />
          <View style={styles.divider} />
          <DetailRow label="Time Out" value={d.timeOut} />
          <View style={styles.divider} />
          <DetailRow label="Total Hours" value={`${d.totalHours} hrs`} valueStyle={styles.hoursValue} />
          <View style={styles.divider} />
          <DetailRow
            label="Entry Type"
            value={d.entryType}
            valueBadge
          />
        </View>

        {/* Journal Preview */}
        <View style={styles.journalHeader}>
          <Text style={styles.journalTitle}>Journal Preview</Text>
          <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
        </View>
        <View style={styles.journalBox}>
          <Text style={styles.journalText}>{d.journalPreview}</Text>
        </View>
      </ScrollView>

      {/* Bottom action buttons */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.mainActions}>
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="pencil" size={16} color={colors.text} style={{ marginRight: 6 }} />
            <Text style={styles.editBtnText}>Edit Entry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.journalBtn}
            onPress={() => navigation.navigate("Journal")}
          >
            <Ionicons name="book-outline" size={16} color={colors.text} style={{ marginRight: 6 }} />
            <Text style={styles.journalBtnText}>Journal</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={16} color={colors.red} style={{ marginRight: 8 }} />
          <Text style={styles.deleteBtnText}>Delete Entry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DetailRow({
  label,
  value,
  valueStyle,
  valueBadge,
}: {
  label: string;
  value: string;
  valueStyle?: object;
  valueBadge?: boolean;
}) {
  return (
    <View style={detailStyles.row}>
      <Text style={detailStyles.label}>{label}</Text>
      {valueBadge ? (
        <View style={detailStyles.badge}>
          <Text style={detailStyles.badgeText}>{value}</Text>
        </View>
      ) : (
        <Text style={[detailStyles.value, valueStyle]}>{value}</Text>
      )}
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  label: { color: colors.textSecondary, fontSize: 14 },
  value: { color: colors.text, fontSize: 15, fontWeight: "700" },
  badge: {
    backgroundColor: colors.cardAlt,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: { color: colors.text, fontSize: 13, fontWeight: "500" },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 20 },

  dateHeading: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 20,
    marginTop: 8,
  },
  detailCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 28,
    overflow: "hidden",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginHorizontal: 18,
  },
  hoursValue: { color: colors.primary },

  journalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  journalTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
  journalBox: {
    backgroundColor: colors.primaryDim,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  journalText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 22,
  },

  footer: { paddingHorizontal: 20, paddingTop: 12 },
  mainActions: { flexDirection: "row", gap: 12, marginBottom: 12 },
  editBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.timerBox,
    borderRadius: 14,
    paddingVertical: 16,
  },
  editBtnText: { color: colors.text, fontSize: 15, fontWeight: "700" },
  journalBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
  },
  journalBtnText: { color: colors.text, fontSize: 15, fontWeight: "700" },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.red,
    borderRadius: 14,
    paddingVertical: 16,
  },
  deleteBtnText: { color: colors.red, fontSize: 15, fontWeight: "700" },
});
