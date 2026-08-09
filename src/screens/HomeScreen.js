import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import C from '../theme';
import AnimatedCard from '../components/AnimatedCard';
import MiniChart from '../components/MiniChart';
import ProgressRing from '../components/ProgressRing';

export default function HomeScreen({ navigation }) {
  const [reminders, setReminders] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [r, t, e] = await Promise.all([
        api.getReminders().catch(() => []),
        api.getTasks().catch(() => []),
        api.getExpenses().catch(() => []),
      ]);
      setReminders(Array.isArray(r) ? r : []);
      setTasks(Array.isArray(t) ? t : []);
      setExpenses(Array.isArray(e) ? e : []);
    } catch (err) { console.log(err); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));
  const onRefresh = () => { setRefreshing(true); loadData(); };
  const pendingTasks = tasks.filter(t => !t.is_completed);
  const completedTasks = tasks.filter(t => t.is_completed);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.iris} />
        <Text style={styles.loadingText}>Cargando tu día...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.iris} />}
    >
      <View style={styles.header}>
        <Text style={styles.logo}>NOLVI</Text>
        <Text style={styles.greeting}>¡Hola! 👋</Text>
        <Text style={styles.subtitle}>Tu resumen de hoy</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <AnimatedCard delay={100}>
          <TouchableOpacity style={[styles.statCard, { backgroundColor: C.irisLight }]} onPress={() => navigation.navigate('Recordatorios')}>
            <Ionicons name="notifications-outline" size={24} color={C.iris} />
            <Text style={[styles.statNumber, { color: C.iris }]}>{reminders.length}</Text>
            <Text style={styles.statLabel}>Recordatorios</Text>
          </TouchableOpacity>
        </AnimatedCard>
        <AnimatedCard delay={200}>
          <TouchableOpacity style={[styles.statCard, { backgroundColor: C.mintLight }]} onPress={() => navigation.navigate('Tareas')}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#2ECC71" />
            <Text style={[styles.statNumber, { color: '#2ECC71' }]}>{pendingTasks.length}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </TouchableOpacity>
        </AnimatedCard>
        <AnimatedCard delay={300}>
          <TouchableOpacity style={[styles.statCard, { backgroundColor: C.peachLight }]} onPress={() => navigation.navigate('Gastos')}>
            <Ionicons name="wallet-outline" size={24} color={C.peach} />
            <Text style={[styles.statNumber, { color: C.peach }]}>${totalExpenses.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Gastos</Text>
          </TouchableOpacity>
        </AnimatedCard>
      </View>

      {/* Task Progress + Expense Chart side by side */}
      <AnimatedCard delay={400} style={styles.dashboardRow}>
        <View style={styles.dashCard}>
          <Text style={styles.dashTitle}>Progreso</Text>
          <ProgressRing completed={completedTasks.length} total={tasks.length} />
        </View>
        <View style={[styles.dashCard, { flex: 1.5 }]}>
          <Text style={styles.dashTitle}>Gastos por categoría</Text>
          <MiniChart expenses={expenses} />
        </View>
      </AnimatedCard>

      {/* Upcoming Reminders */}
      <AnimatedCard delay={500} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="notifications" size={20} color={C.iris} />
          <Text style={styles.sectionTitle}>Próximos recordatorios</Text>
        </View>
        {reminders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="notifications-off-outline" size={28} color={C.muted} />
            <Text style={styles.emptyText}>Sin recordatorios</Text>
          </View>
        ) : (
          reminders.slice(0, 3).map((r, i) => (
            <AnimatedCard key={r.id || i} delay={600 + i * 100}>
              <View style={styles.listItem}>
                <View style={styles.listIcon}>
                  <Ionicons name="time-outline" size={18} color={C.iris} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listItemText}>{r.title || r.message}</Text>
                  <Text style={styles.listItemSub}>
                    {r.remind_at ? new Date(r.remind_at).toLocaleString('es-CO') : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={C.muted} />
              </View>
            </AnimatedCard>
          ))
        )}
      </AnimatedCard>

      {/* Pending Tasks */}
      <AnimatedCard delay={700} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="checkmark-circle" size={20} color="#2ECC71" />
          <Text style={styles.sectionTitle}>Tareas pendientes</Text>
        </View>
        {pendingTasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-done-outline" size={28} color="#2ECC71" />
            <Text style={styles.emptyText}>¡Todo al día! 🎉</Text>
          </View>
        ) : (
          pendingTasks.slice(0, 5).map((t, i) => (
            <AnimatedCard key={t.id || i} delay={800 + i * 100}>
              <View style={styles.listItem}>
                <View style={[styles.listIcon, { backgroundColor: C.mintLight }]}>
                  <Ionicons name="ellipse-outline" size={18} color="#2ECC71" />
                </View>
                <Text style={styles.listItemText}>{t.title}</Text>
              </View>
            </AnimatedCard>
          ))
        )}
      </AnimatedCard>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  loadingText: { marginTop: 10, color: C.muted, fontSize: 16 },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 30, backgroundColor: C.iris, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  logo: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 3, marginBottom: 8 },
  greeting: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 12, marginTop: -20 },
  statCard: { flex: 1, marginHorizontal: 4, borderRadius: 16, padding: 14, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
  statNumber: { fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  statLabel: { fontSize: 11, color: C.textSec, marginTop: 2, textAlign: 'center' },
  dashboardRow: { flexDirection: 'row', marginTop: 16, marginHorizontal: 16, gap: 10 },
  dashCard: { flex: 1, backgroundColor: C.white, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  dashTitle: { fontSize: 13, fontWeight: '700', color: C.textSec, marginBottom: 10 },
  section: { marginTop: 20, marginHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginLeft: 8 },
  listItem: { backgroundColor: C.white, padding: 14, borderRadius: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  listIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.irisLight, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  listItemText: { fontSize: 15, color: C.text, fontWeight: '500' },
  listItemSub: { fontSize: 12, color: C.muted, marginTop: 3 },
  emptyCard: { backgroundColor: C.white, padding: 24, borderRadius: 14, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 14, color: C.muted },
});
