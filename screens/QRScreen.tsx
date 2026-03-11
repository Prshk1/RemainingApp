import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import { colors } from "../theme/colors";

const { width } = Dimensions.get("window");
const QR_SIZE = width - 64;

/**
 * QR Code screen — matches Figma QR design.
 * Shows placeholder QR frame, internship ID, and upload button.
 */
export default function QRScreen() {
  return (
    // Header handles its own safe-area top padding
    <View style={styles.container}>
      <Header title="Scan QR Code" />

      {/* Instruction */}
      <Text style={styles.instruction}>
        Show this code to the scanner to log your hours.
      </Text>

      {/* QR placeholder box */}
      <View style={styles.qrBox}>
        {/* Placeholder QR grid — visual approximation with nested boxes */}
        <View style={styles.qrInner}>
          {/* Top-left finder */}
          <View style={[styles.finder, styles.finderTL]}>
            <View style={styles.finderInner} />
          </View>
          {/* Top-right finder */}
          <View style={[styles.finder, styles.finderTR]}>
            <View style={styles.finderInner} />
          </View>
          {/* Bottom-left finder */}
          <View style={[styles.finder, styles.finderBL]}>
            <View style={styles.finderInner} />
          </View>
          {/* Center QR label */}
          <View style={styles.qrCenter}>
            <Ionicons name="qr-code" size={80} color={colors.text} />
          </View>
        </View>
      </View>

      {/* Internship ID */}
      <Text style={styles.idText}>ID: 10934-APP</Text>

      {/* Upload New QR */}
      <TouchableOpacity style={styles.uploadBtn} activeOpacity={0.8}>
        <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
        <Text style={styles.uploadBtnText}>Upload New QR</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    alignItems: "center",
  },
  instruction: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 16,
    marginBottom: 28,
    paddingHorizontal: 24,
    alignSelf: "flex-start",
  },
  qrBox: {
    width: QR_SIZE,
    height: QR_SIZE,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  qrInner: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.text,
    justifyContent: "center",
    alignItems: "center",
  },
  finder: {
    position: "absolute",
    width: 54,
    height: 54,
    borderWidth: 5,
    borderColor: colors.backgroundAlt,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  finderTL: { top: 16, left: 16 },
  finderTR: { top: 16, right: 16 },
  finderBL: { bottom: 16, left: 16 },
  finderInner: {
    width: 22,
    height: 22,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 2,
  },
  qrCenter: {
    backgroundColor: colors.text,
    justifyContent: "center",
    alignItems: "center",
  },
  idText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 32,
    letterSpacing: 0.5,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: colors.primaryDim,
  },
  uploadBtnText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});