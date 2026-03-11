import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { Notification } from "../context/NotificationContext";

interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

export function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <Ionicons name="checkmark-circle" size={24} color={colors.green} />;
      case "error":
        return <Ionicons name="close-circle" size={24} color={colors.red} />;
      case "warning":
        return <Ionicons name="warning" size={24} color={colors.orange} />;
      case "info":
      default:
        return <Ionicons name="information-circle" size={24} color={colors.primary} />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case "success":
        return styles.successBg;
      case "error":
        return styles.errorBg;
      case "warning":
        return styles.warningBg;
      case "info":
      default:
        return styles.infoBg;
    }
  };

  return (
    <View style={[styles.container, getBackgroundColor()]}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>{getIcon()}</View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{notification.title}</Text>
          {notification.message && <Text style={styles.message}>{notification.message}</Text>}
        </View>
      </View>
      <TouchableOpacity
        onPress={() => onDismiss(notification.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close" size={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 8,
      borderLeftWidth: 4,
    },
    content: {
      flex: 1,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    iconWrap: {
      marginTop: 2,
    },
    textWrap: {
      flex: 1,
      gap: 4,
    },
    title: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    message: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    successBg: {
      backgroundColor: colors.greenBg,
      borderLeftColor: colors.green,
    },
    errorBg: {
      backgroundColor: colors.redBg,
      borderLeftColor: colors.red,
    },
    warningBg: {
      backgroundColor: "rgba(255,167,38,0.1)",
      borderLeftColor: colors.orange,
    },
    infoBg: {
      backgroundColor: "rgba(157,92,255,0.1)",
      borderLeftColor: colors.primary,
    },
  });
}
