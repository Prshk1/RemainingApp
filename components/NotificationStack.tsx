import React from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNotification } from "../context/NotificationContext";
import { NotificationItem } from "./NotificationItem";

export function NotificationStack() {
  const insets = useSafeAreaInsets();
  const { notifications, hideNotification } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 8, paddingHorizontal: insets.left || 8, paddingRight: insets.right || 8 },
      ]}
      pointerEvents="box-none"
    >
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={hideNotification}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    pointerEvents: "box-none",
  },
});
