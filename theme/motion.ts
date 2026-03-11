/** Shared motion tokens — use these everywhere instead of hard-coded numbers */
export const motion = {
  // Durations (ms)
  duration: {
    instant: 100,
    fast: 180,
    normal: 260,
    slow: 380,
    lazy: 500,
  },

  // Native spring configs (for Animated.spring)
  spring: {
    snappy: { useNativeDriver: true, tension: 220, friction: 20 },
    bouncy: { useNativeDriver: true, tension: 180, friction: 14 },
    gentle: { useNativeDriver: true, tension: 120, friction: 18 },
    tab:    { useNativeDriver: true, tension: 300, friction: 26 },
  },

  // Timing easing presets (Easing functions as strings for reference)
  easing: {
    enter: "easeOut",   // decelerate into position
    exit:  "easeIn",    // accelerate out
    standard: "easeInOut",
  },

  // Scale targets used throughout the app
  scale: {
    press:   0.96,
    pressed: 0.93,
    pop:     1.06,
  },

  // Opacity targets
  opacity: {
    hidden:    0,
    dimmed:    0.4,
    secondary: 0.7,
    full:      1,
  },

  // Vertical translation values (px) for screen entry / slide animations
  translate: {
    screenIn:  24,   // screens slide up by this amount on entry
    modalIn:   40,   // modals slide up further
    listItem:  16,   // staggered list items
  },
};
