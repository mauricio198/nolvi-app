import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import C from '../theme';

export default function ProgressRing({ completed, total, color = '#2ECC71' }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={[styles.ring, { borderColor: C.cardBorder }]}>
        <View style={[styles.ringFill, { borderColor: color }]}>
          <Text style={[styles.pctText, { color }]}>{pct}%</Text>
        </View>
      </View>
      <Text style={styles.label}>{completed}/{total} completadas</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  ring: { width: 70, height: 70, borderRadius: 35, borderWidth: 4, justifyContent: 'center', alignItems: 'center' },
  ringFill: { width: 58, height: 58, borderRadius: 29, borderWidth: 3, justifyContent: 'center', alignItems: 'center', backgroundColor: C.white },
  pctText: { fontSize: 16, fontWeight: 'bold' },
  label: { fontSize: 11, color: C.muted, marginTop: 6 },
});
