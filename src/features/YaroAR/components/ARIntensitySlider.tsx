import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
export default function ARIntensitySlider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  const width = useRef(1),
    last = useRef(0),
    current = useRef(value),
    change = useRef(onChange);
  current.current = value;
  change.current = onChange;
  const [drag, setDrag] = useState<number | null>(null);
  const update = (x: number, final = false) => {
    if (disabled) return;
    const next =
      min + Math.min(1, Math.max(0, x / width.current)) * (max - min);
    current.current = next;
    setDrag(next);
    if (final || Date.now() - last.current > 80) {
      last.current = Date.now();
      change.current(next);
    }
    if (final) setDrag(null);
  };
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled,
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: event => update(event.nativeEvent.locationX),
    onPanResponderMove: event => update(event.nativeEvent.locationX),
    onPanResponderRelease: event => update(event.nativeEvent.locationX, true),
    onPanResponderTerminate: () => {
      change.current(current.current);
      setDrag(null);
    },
  });
  const shown = drag ?? value;
  return (
    <View style={[s.wrap, disabled && { opacity: 0.4 }]}>
      <View style={s.row}>
        <Text style={s.label}>{label}</Text>
        <Text style={s.value}>
          {Math.round(((shown - min) / (max - min)) * 100)}
        </Text>
      </View>
      <View style={s.row}>
        <TouchableOpacity
          accessibilityLabel={`Decrease ${label}`}
          disabled={disabled}
          onPress={() => onChange(Math.max(min, value - (max - min) * 0.05))}
        >
          <Text style={s.step}>−</Text>
        </TouchableOpacity>
        <View
          accessibilityRole="adjustable"
          accessibilityLabel={label}
          accessibilityValue={{ min, max, now: value }}
          accessibilityState={{ disabled }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={event =>
            onChange(
              Math.min(
                max,
                Math.max(
                  min,
                  value +
                    (event.nativeEvent.actionName === 'increment' ? 1 : -1) *
                      (max - min) *
                      0.05,
                ),
              ),
            )
          }
          onLayout={event => {
            width.current = event.nativeEvent.layout.width;
          }}
          {...responder.panHandlers}
          style={s.touch}
        >
          <View style={s.track}>
            <View
              style={[
                s.fill,
                { width: `${((shown - min) / (max - min)) * 100}%` },
              ]}
            />
          </View>
          <View
            style={[
              s.thumb,
              { left: `${((shown - min) / (max - min)) * 100}%` },
            ]}
          />
        </View>
        <TouchableOpacity
          accessibilityLabel={`Increase ${label}`}
          disabled={disabled}
          onPress={() => onChange(Math.min(max, value + (max - min) * 0.05))}
        >
          <Text style={s.step}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 7 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: { color: '#E6DDEC', fontSize: 12 },
  value: { color: '#F4D790', fontSize: 11 },
  step: { color: '#E6DDEC', fontSize: 24, paddingHorizontal: 8 },
  touch: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  track: { height: 3, backgroundColor: '#FFFFFF28', borderRadius: 3 },
  fill: { height: 3, backgroundColor: '#EDC36F' },
  thumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
    backgroundColor: '#FFE8AF',
  },
});
