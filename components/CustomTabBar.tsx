/**
 * CustomTabBar — notched center-docked QR action tab bar.
 *
 * The QR action button sits in a carved notch at the center of the bar,
 * floating slightly above the bar surface. Regular tabs have animated
 * icon emphasis on active state.
 */
import React, { useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useTheme } from "../context/ThemeContext";
import { motion } from "../theme/motion";

const { width } = Dimensions.get("window");
const NOTCH_RADIUS = 34;        // half of QR button
const NOTCH_DEPTH  = 14;        // how far the notch dips into the bar
const BAR_HEIGHT   = 58;

/** Animated tab icon that scales up when active */
function TabIcon({ name, active, color }: { name: keyof typeof Ionicons.glyphMap; active: boolean; color: string }) {
  const scale = useRef(new Animated.Value(active ? 1.15 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: active ? 1.15 : 1,
      ...motion.spring.tab,
    }).start();
  }, [active]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Ionicons name={name} size={24} color={color} />
    </Animated.View>
  );
}

const TAB_ICON_MAP: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Dashboard:  { active: "layers",    inactive: "layers-outline" },
  Attendance: { active: "calendar",  inactive: "calendar-outline" },
  Bonus:      { active: "star",      inactive: "star-outline" },
  Settings:   { active: "settings",  inactive: "settings-outline" },
};

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const barHeight = BAR_HEIGHT + insets.bottom;

  // Spring animation for QR button press feedback
  const qrScale = useRef(new Animated.Value(1)).current;

  function pressQR() {
    Animated.sequence([
      Animated.spring(qrScale, { toValue: motion.scale.pressed, ...motion.spring.snappy }),
      Animated.spring(qrScale, { toValue: 1, ...motion.spring.bouncy }),
    ]).start();
  }

  // Split tabs: left (Dashboard, Attendance) and right (Bonus, Settings)
  // The center "QR Code" tab is the notch button
  const leftTabs  = state.routes.slice(0, 2);
  const centerTab = state.routes[2]; // QR Code
  const rightTabs = state.routes.slice(3);

  function renderTab(route: typeof state.routes[0], idx: number, absoluteIdx: number) {
    const { options } = descriptors[route.key];
    const label = (options.tabBarLabel as string) ?? route.name;
    const isFocused = state.index === absoluteIdx;
    const activeColor   = colors.primary;
    const inactiveColor = colors.textMuted;
    const color = isFocused ? activeColor : inactiveColor;
    const iconDef = TAB_ICON_MAP[route.name];
    const iconName = iconDef ? (isFocused ? iconDef.active : iconDef.inactive) : "ellipse-outline";

    function onPress() {
      const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    }

    return (
      <TouchableOpacity
        key={route.key}
        style={styles.tabBtn}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <TabIcon name={iconName} active={isFocused} color={color} />
        <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>{label}</Text>
      </TouchableOpacity>
    );
  }

  function onPressCenter() {
    pressQR();
    const event = navigation.emit({ type: "tabPress", target: centerTab.key, canPreventDefault: true });
    if (state.index !== 2 && !event.defaultPrevented) {
      navigation.navigate(centerTab.name);
    }
  }

  const qrActive = state.index === 2;

  return (
    <View style={[styles.wrapper, { backgroundColor: "transparent", paddingBottom: insets.bottom }]}>
      {/* Bar surface */}
      <View
        style={[
          styles.bar,
          {
            height: BAR_HEIGHT,
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            shadowColor: "#000",
          },
        ]}
      >
        {/* Left tabs */}
        <View style={styles.tabSegment}>
          {leftTabs.map((route, i) => renderTab(route, i, i))}
        </View>

        {/* Center notch gap */}
        <View style={styles.notchGap} />

        {/* Right tabs */}
        <View style={styles.tabSegment}>
          {rightTabs.map((route, i) => renderTab(route, i, i + 3))}
        </View>
      </View>

      {/* Notched QR button — floats above the bar */}
      <View style={styles.notchBtnWrap} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.notchRing,
            { backgroundColor: colors.background, transform: [{ scale: qrScale }] },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.notchBtn,
              {
                backgroundColor: qrActive ? colors.primarySoft : colors.primary,
                shadowColor: colors.primary,
              },
            ]}
            onPress={onPressCenter}
            activeOpacity={0.9}
          >
            <Ionicons name="qr-code" size={26} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const NOTCH_BTN_SIZE = NOTCH_RADIUS * 2;
const NOTCH_RING_SIZE = NOTCH_BTN_SIZE + 8;

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 20,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  tabSegment: {
    flex: 1,
    flexDirection: "row",
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 3,
  },
  notchGap: {
    width: NOTCH_RING_SIZE + 14,
  },
  notchBtnWrap: {
    position: "absolute",
    top: -(NOTCH_RING_SIZE / 2 + NOTCH_DEPTH),
    left: 0,
    right: 0,
    alignItems: "center",
  },
  notchRing: {
    width: NOTCH_RING_SIZE,
    height: NOTCH_RING_SIZE,
    borderRadius: NOTCH_RING_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  notchBtn: {
    width: NOTCH_BTN_SIZE,
    height: NOTCH_BTN_SIZE,
    borderRadius: NOTCH_BTN_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    elevation: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
  },
});
