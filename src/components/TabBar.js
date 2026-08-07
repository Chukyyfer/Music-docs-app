import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export default function TabBar({ active, onChange }) {
  return (
    <View style={styles.container}>
      <TabButton
        label="Music"
        icon="musical-notes"
        selected={active === 'music'}
        color={colors.music}
        onPress={() => onChange('music')}
      />
      <TabButton
        label="Documents"
        icon="document-text"
        selected={active === 'documents'}
        color={colors.docs}
        onPress={() => onChange('documents')}
      />
    </View>
  );
}

function TabButton({ label, icon, selected, color, onPress }) {
  return (
    <TouchableOpacity style={styles.tab} onPress={onPress} activeOpacity={0.7}>
      <Ionicons
        name={selected ? icon : `${icon}-outline`}
        size={22}
        color={selected ? color : colors.textSecondary}
      />
      <Text style={[styles.label, { color: selected ? color : colors.textSecondary }]}>
        {label}
      </Text>
      {selected && <View style={[styles.indicator, { backgroundColor: color }]} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingTop: 8,
    paddingBottom: 8,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 12, fontWeight: '600' },
  indicator: { width: 18, height: 3, borderRadius: 2, marginTop: 2 },
});
