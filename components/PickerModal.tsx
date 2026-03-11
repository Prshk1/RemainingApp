/**
 * PickerModal — A single scrollable-column picker modal that can operate in
 * three modes:
 *
 *   "date"     — Calendar-style month/year navigation + day grid.
 *   "time"     — Hour and minute scroll columns; respects 12h/24h setting.
 *   "duration" — Hour (0-23) and minute (0, 15, 30, 45) scroll columns.
 *
 * Usage
 * -----
 *   <PickerModal
 *     visible={show}
 *     mode="date"
 *     value={date}          // ISO date "YYYY-MM-DD" for date mode
 *     onConfirm={(v) => setDate(v)}
 *     onCancel={() => setShow(false)}
 *   />
 *
 *   <PickerModal
 *     visible={show}
 *     mode="time"
 *     value={time}          // "HH:MM" 24-h string
 *     timeFormat="12h"      // from AppSettings
 *     onConfirm={(v) => setTime(v)}
 *     onCancel={() => setShow(false)}
 *   />
 *
 *   <PickerModal
 *     visible={show}
 *     mode="duration"
 *     value={duration}      // "HH:MM" representation of decimal hours
 *     onConfirm={(v) => setDuration(v)}  // returns "HH:MM"
 *     onCancel={() => setShow(false)}
 *   />
 *
 * All values emitted from onConfirm are already normalized:
 *   date     → "YYYY-MM-DD"
 *   time     → "HH:MM"  (24-h)
 *   duration → "HH:MM"  (HH 0-23, MM 0|15|30|45)
 */
import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

const { width: SCREEN_W } = Dimensions.get("window");

// ── helpers ───────────────────────────────────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Parse "YYYY-MM-DD" → { year, month (0-based), day } */
function parseDate(s: string): { year: number; month: number; day: number } {
  const parts = s.split("-").map(Number);
  const year  = parts[0] ?? new Date().getFullYear();
  const month = (parts[1] ?? new Date().getMonth() + 1) - 1;
  const day   = parts[2] ?? new Date().getDate();
  return { year, month, day };
}

/** Parse "HH:MM" → { hour, minute } */
function parseHM(s: string): { hour: number; minute: number } {
  const parts = s.split(":").map(Number);
  return { hour: parts[0] ?? 0, minute: parts[1] ?? 0 };
}

/** Days in a month */
function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

/** First weekday (0=Sun) of a month */
function firstWeekday(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_LABELS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

// ── types ─────────────────────────────────────────────────────────────────────

export interface PickerModalProps {
  visible: boolean;
  mode: "date" | "time" | "duration";
  /** Date mode: "YYYY-MM-DD".  Time/duration mode: "HH:MM" (24h). */
  value: string;
  /** Only used in time mode — determines 12h/24h display. */
  timeFormat?: "12h" | "24h";
  title?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

// ── DatePicker ────────────────────────────────────────────────────────────────

function DatePicker({
  value, colors, onConfirm, onCancel,
}: {
  value: string;
  colors: ReturnType<typeof useTheme>["colors"];
  onConfirm: (v: string) => void;
  onCancel: () => void;
}) {
  const parsed = parseDate(value);
  const [year, setYear]   = useState(parsed.year);
  const [month, setMonth] = useState(parsed.month);
  const [day, setDay]     = useState(parsed.day);

  const today = new Date();
  const dim   = daysInMonth(year, month);
  const first = firstWeekday(year, month);

  // Keep day in range when month/year changes
  useEffect(() => {
    if (day > daysInMonth(year, month)) setDay(daysInMonth(year, month));
  }, [year, month]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  // Build calendar grid cells (null = empty)
  const cells: (number | null)[] = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function confirm() {
    onConfirm(`${year}-${pad(month + 1)}-${pad(day)}`);
  }

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <>
      {/* Month / year navigation */}
      <View style={dp.navRow}>
        <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[dp.navTitle, { color: colors.text }]}>
          {MONTH_NAMES[month]} {year}
        </Text>
        <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-forward" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Day-of-week labels */}
      <View style={dp.weekRow}>
        {DAY_LABELS.map((l) => (
          <Text key={l} style={[dp.weekLabel, { color: colors.textMuted }]}>{l}</Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={dp.grid}>
        {cells.map((d, idx) => {
          if (d === null) return <View key={`empty-${idx}`} style={dp.cell} />;
          const selected = d === day;
          const todayCell = isToday(d);
          return (
            <TouchableOpacity
              key={d}
              style={dp.cell}
              onPress={() => setDay(d)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  dp.dayCircle,
                  selected && { backgroundColor: colors.primary },
                  !selected && todayCell && { borderWidth: 1.5, borderColor: colors.primary },
                  selected && todayCell && { borderWidth: 2, borderColor: "rgba(255,255,255,0.45)" },
                ]}
              >
                <Text
                  style={[
                    dp.cellText,
                    { color: selected ? "#fff" : todayCell ? colors.primary : colors.text },
                    selected && { fontWeight: "700" },
                  ]}
                >
                  {d}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Action buttons */}
      <View style={[shared.btnRow, { borderTopColor: colors.separator }]}>
        <TouchableOpacity style={[shared.btn, { borderRightColor: colors.separator }]} onPress={onCancel}>
          <Text style={[shared.btnText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={shared.btn} onPress={confirm}>
          <Text style={[shared.btnText, { color: colors.primary, fontWeight: "700" }]}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const dp = StyleSheet.create({
  navRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  navTitle: { fontSize: 16, fontWeight: "700" },
  weekRow: { flexDirection: "row", marginBottom: 4 },
  weekLabel: { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, justifyContent: "center", alignItems: "center" },
  dayCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  cellText: { fontSize: 14, includeFontPadding: false, lineHeight: 14, textAlign: "center" },
});

// ── ScrollColumn ──────────────────────────────────────────────────────────────

const ITEM_H = 44;

function ScrollColumn({
  items, selectedIndex, onSelect, colors, width,
}: {
  items: string[];
  selectedIndex: number;
  onSelect: (idx: number) => void;
  colors: ReturnType<typeof useTheme>["colors"];
  width?: number;
}) {
  const scrollRef = React.useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: false });
  }, [selectedIndex]);

  return (
    <View style={[sc.wrap, width ? { width } : { flex: 1 }]}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
          onSelect(Math.min(Math.max(idx, 0), items.length - 1));
        }}
      >
        <View style={{ height: ITEM_H }} />
        {items.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <TouchableOpacity
              key={idx}
              style={[sc.item, isSelected && { backgroundColor: colors.primaryDim, borderRadius: 10 }]}
              onPress={() => {
                onSelect(idx);
                scrollRef.current?.scrollTo({ y: idx * ITEM_H, animated: true });
              }}
              activeOpacity={0.7}
            >
              <Text style={[sc.itemText, { color: isSelected ? colors.primary : colors.text }, isSelected && { fontWeight: "700" }]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: ITEM_H }} />
      </ScrollView>
      {/* Selection highlight overlay */}
      <View style={[sc.highlight, { borderColor: colors.border, pointerEvents: "none" }]} />
    </View>
  );
}

const sc = StyleSheet.create({
  wrap: { height: ITEM_H * 5, overflow: "hidden" },
  item: { height: ITEM_H, justifyContent: "center", alignItems: "center" },
  itemText: { fontSize: 20 },
  highlight: {
    position: "absolute",
    top: ITEM_H * 2,
    left: 4,
    right: 4,
    height: ITEM_H,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRadius: 10,
    pointerEvents: "none",
  },
});

// ── TimePicker ────────────────────────────────────────────────────────────────

function TimePicker({
  value, timeFormat, colors, onConfirm, onCancel,
}: {
  value: string;
  timeFormat: "12h" | "24h";
  colors: ReturnType<typeof useTheme>["colors"];
  onConfirm: (v: string) => void;
  onCancel: () => void;
}) {
  const parsed = parseHM(value);

  // Normalize to 12h state
  const initHour12 = parsed.hour === 0 ? 12 : parsed.hour > 12 ? parsed.hour - 12 : parsed.hour;
  const initAmpm   = parsed.hour < 12 ? 0 : 1; // 0=AM, 1=PM

  const [hour24, setHour24]  = useState(parsed.hour);       // for 24h mode
  const [hour12, setHour12]  = useState(initHour12);        // for 12h mode
  const [ampm, setAmpm]      = useState(initAmpm);          // 0=AM, 1=PM
  const [minute, setMinute]  = useState(parsed.minute);

  const hours24 = Array.from({ length: 24 }, (_, i) => pad(i));
  const hours12 = Array.from({ length: 12 }, (_, i) => pad(i + 1));
  const minutes = Array.from({ length: 60 }, (_, i) => pad(i));
  const ampmItems = ["AM", "PM"];

  function confirm() {
    let h: number;
    if (timeFormat === "24h") {
      h = hour24;
    } else {
      if (ampm === 0) {
        h = hour12 === 12 ? 0 : hour12;
      } else {
        h = hour12 === 12 ? 12 : hour12 + 12;
      }
    }
    onConfirm(`${pad(h)}:${pad(minute)}`);
  }

  return (
    <>
      <View style={tp.cols}>
        {timeFormat === "24h" ? (
          <>
            <ScrollColumn
              items={hours24}
              selectedIndex={hour24}
              onSelect={setHour24}
              colors={colors}
            />
            <Text style={[tp.colon, { color: colors.textSecondary }]}>:</Text>
            <ScrollColumn
              items={minutes}
              selectedIndex={minute}
              onSelect={setMinute}
              colors={colors}
            />
          </>
        ) : (
          <>
            <ScrollColumn
              items={hours12}
              selectedIndex={hour12 - 1}
              onSelect={(i) => setHour12(i + 1)}
              colors={colors}
            />
            <Text style={[tp.colon, { color: colors.textSecondary }]}>:</Text>
            <ScrollColumn
              items={minutes}
              selectedIndex={minute}
              onSelect={setMinute}
              colors={colors}
            />
            <ScrollColumn
              items={ampmItems}
              selectedIndex={ampm}
              onSelect={setAmpm}
              colors={colors}
              width={72}
            />
          </>
        )}
      </View>

      <View style={[shared.btnRow, { borderTopColor: colors.separator }]}>
        <TouchableOpacity style={[shared.btn, { borderRightColor: colors.separator }]} onPress={onCancel}>
          <Text style={[shared.btnText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={shared.btn} onPress={confirm}>
          <Text style={[shared.btnText, { color: colors.primary, fontWeight: "700" }]}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const tp = StyleSheet.create({
  cols: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, marginBottom: 4 },
  colon: { fontSize: 24, fontWeight: "700", marginHorizontal: 4, alignSelf: "center" },
});

// ── DurationPicker ────────────────────────────────────────────────────────────

function DurationPicker({
  value, colors, onConfirm, onCancel,
}: {
  value: string;
  colors: ReturnType<typeof useTheme>["colors"];
  onConfirm: (v: string) => void;
  onCancel: () => void;
}) {
  const parsed  = parseHM(value);
  const MINS    = [0, 15, 30, 45];
  const initMin = MINS.indexOf(parsed.minute) >= 0 ? MINS.indexOf(parsed.minute) : 0;

  const [hour, setHour]       = useState(Math.min(parsed.hour, 23));
  const [minIdx, setMinIdx]   = useState(initMin);

  const hourItems = Array.from({ length: 24 }, (_, i) => `${i}h`);
  const minItems  = MINS.map((m) => `${m}m`);

  function confirm() {
    onConfirm(`${pad(hour)}:${pad(MINS[minIdx])}`);
  }

  return (
    <>
      <View style={tp.cols}>
        <ScrollColumn
          items={hourItems}
          selectedIndex={hour}
          onSelect={setHour}
          colors={colors}
        />
        <ScrollColumn
          items={minItems}
          selectedIndex={minIdx}
          onSelect={setMinIdx}
          colors={colors}
        />
      </View>

      <View style={[shared.btnRow, { borderTopColor: colors.separator }]}>
        <TouchableOpacity style={[shared.btn, { borderRightColor: colors.separator }]} onPress={onCancel}>
          <Text style={[shared.btnText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={shared.btn} onPress={confirm}>
          <Text style={[shared.btnText, { color: colors.primary, fontWeight: "700" }]}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// ── shared styles ─────────────────────────────────────────────────────────────

const shared = StyleSheet.create({
  btnRow: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
    marginHorizontal: -20,
  },
  btn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { fontSize: 16 },
});

// ── PickerModal ───────────────────────────────────────────────────────────────

export default function PickerModal({
  visible, mode, value, timeFormat = "24h", title, onConfirm, onCancel,
}: PickerModalProps) {
  const { colors } = useTheme();
  const slideAnim  = React.useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 180, friction: 18 }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible]);

  const defaultTitles: Record<PickerModalProps["mode"], string> = {
    date: "Select Date",
    time: "Select Time",
    duration: "Select Duration",
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel} statusBarTranslucent>
      {/* Scrim */}
      <TouchableOpacity style={modal.scrim} activeOpacity={1} onPress={onCancel} />

      {/* Sheet */}
      <Animated.View
        style={[
          modal.sheet,
          { backgroundColor: colors.card, borderTopColor: colors.border },
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={modal.handle} />
        <Text style={[modal.title, { color: colors.text }]}>
          {title ?? defaultTitles[mode]}
        </Text>

        {mode === "date" && (
          <DatePicker value={value} colors={colors} onConfirm={onConfirm} onCancel={onCancel} />
        )}
        {mode === "time" && (
          <TimePicker
            value={value}
            timeFormat={timeFormat}
            colors={colors}
            onConfirm={onConfirm}
            onCancel={onCancel}
          />
        )}
        {mode === "duration" && (
          <DurationPicker value={value} colors={colors} onConfirm={onConfirm} onCancel={onCancel} />
        )}
      </Animated.View>
    </Modal>
  );
}

const modal = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxWidth: Math.min(SCREEN_W, 480),
    alignSelf: "center",
    width: "100%",
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(128,128,128,0.4)",
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
});
