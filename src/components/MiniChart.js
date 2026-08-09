import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import C from '../theme';

export default function MiniChart({ expenses }) {
  // Agrupar por categoría
  const byCategory = {};
  expenses.forEach(e => {
    const cat = e.category || 'Otro';
    byCategory[cat] = (byCategory[cat] || 0) + (e.amount || 0);
  });

  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = entries.length > 0 ? entries[0][1] : 1;

  const COLORS = {
    Comida: '#FF8A6B',
    Transporte: '#7C6AF6',
    Servicios: '#3EEBC0',
    Salud: '#FF6B6B',
    Entretenimiento: '#FFD93D',
    Otros: '#A0A5BD',
    Otro: '#A0A5BD',
  };

  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Sin datos para graficar</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {entries.map(([cat, amount], i) => (
        <View key={cat} style={styles.row}>
          <Text style={styles.label} numberOfLines={1}>{cat}</Text>
          <View style={styles.barBg}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${(amount / max) * 100}%`,
                  backgroundColor: COLORS[cat] || '#A0A5BD',
                },
              ]}
            />
          </View>
          <Text style={styles.amount}>${amount.toLocaleString()}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  label: { width: 75, fontSize: 12, color: C.textSec, fontWeight: '500' },
  barBg: { flex: 1, height: 12, backgroundColor: C.bg, borderRadius: 6, overflow: 'hidden', marginHorizontal: 8 },
  barFill: { height: '100%', borderRadius: 6 },
  amount: { width: 70, fontSize: 12, fontWeight: '600', color: C.text, textAlign: 'right' },
  empty: { paddingVertical: 20, alignItems: 'center' },
  emptyText: { color: C.muted, fontSize: 14 },
});
