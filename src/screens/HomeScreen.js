import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import C, { fonts } from '../theme';
import AnimatedCard from '../components/AnimatedCard';

export default function HomeScreen({ navigation }) {
  const [reminders, setReminders] = useState([]);
  const [tasks, setTasks]         = useState([]);
  const [expenses, setExpenses]   = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading]     = useState(true);

  const loadData = async () => {
    try {
      const [r, t, e, b] = await Promise.all([
        api.getReminders().catch(() => []),
        api.getTasks().catch(() => []),
        api.getExpenses().catch(() => []),
        api.getBirthdays().catch(() => []),
      ]);
      setReminders(Array.isArray(r) ? r : []);
      setTasks(Array.isArray(t) ? t : []);
      setExpenses(Array.isArray(e) ? e : []);
      setBirthdays(Array.isArray(b) ? b : []);
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const pendingTasks   = tasks.filter(t => !t.is_completed);
  const completedTasks = tasks.filter(t => t.is_completed);
  const totalExpenses  = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const completedPct   = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const daysUntilBirthday = (birthDateStr) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const bd    = new Date(birthDateStr);
    let next    = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
    if (next < today) next = new Date(today.getFullYear() + 1, bd.getMonth(), bd.getDate());
    return Math.round((next - today) / (1000 * 60 * 60 * 24));
  };

  const nextBirthday = birthdays.length > 0
    ? [...birthdays].sort((a, b) => daysUntilBirthday(a.birth_date) - daysUntilBirthday(b.birth_date))[0]
    : null;
  const nextReminder = reminders.length > 0 ? reminders[0] : null;
  const nextTask     = pendingTasks.length > 0 ? pendingTasks[0] : null;

  // Top categoria de gastos
  const topCategory = expenses.reduce((acc, e) => {
    const cat = e.category || 'Otros';
    acc[cat] = (acc[cat] || 0) + (e.amount || 0);
    return acc;
  }, {});
  const topCatName   = Object.keys(topCategory).sort((a, b) => topCategory[b] - topCategory[a])[0] || null;
  const topCatAmount = topCatName ? topCategory[topCatName] : 0;

  if (loading) {
    return (
      <View style={st.center}>
        <ActivityIndicator size="large" color={C.purple} />
        <Text style={st.loadingText}>Cargando tu día...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={st.safe}>
      <View style={st.container}>

        {/* HEADER */}
        <View style={st.header}>
          <View>
            <Text style={st.logo}>NOLVI</Text>
            <Text style={st.greeting}>¡Hola! 👋</Text>
          </View>
          <Text style={st.subtitle}>Tu resumen de hoy</Text>
        </View>

        {/* STATS ROW */}
        <View style={st.statsRow}>
          <AnimatedCard delay={100} style={{ flex: 1 }}>
            <TouchableOpacity style={[st.statCard, { backgroundColor: C.purpleLight }]} onPress={() => navigation.navigate('Recordatorios')}>
              <Ionicons name="notifications-outline" size={20} color={C.purple} />
              <Text style={[st.statNumber, { color: C.purple }]}>{reminders.length}</Text>
              <Text style={st.statLabel}>Recordatorios</Text>
            </TouchableOpacity>
          </AnimatedCard>
          <AnimatedCard delay={150} style={{ flex: 1 }}>
            <TouchableOpacity style={[st.statCard, { backgroundColor: C.greenLight }]} onPress={() => navigation.navigate('Tareas')}>
              <Ionicons name="checkmark-circle-outline" size={20} color={C.green} />
              <Text style={[st.statNumber, { color: C.green }]}>{pendingTasks.length}</Text>
              <Text style={st.statLabel}>Pendientes</Text>
            </TouchableOpacity>
          </AnimatedCard>
          <AnimatedCard delay={200} style={{ flex: 1 }}>
            <TouchableOpacity style={[st.statCard, { backgroundColor: C.coralLight }]} onPress={() => navigation.navigate('Gastos')}>
              <Ionicons name="wallet-outline" size={20} color={C.coral} />
              <Text style={[st.statNumber, { color: C.coral }]} numberOfLines={1}>${totalExpenses.toLocaleString()}</Text>
              <Text style={st.statLabel}>Gastos</Text>
            </TouchableOpacity>
          </AnimatedCard>
        </View>

        {/* TARJETAS FINTECH */}
        <AnimatedCard delay={250} style={st.dashRow}>

          {/* PROGRESO — morado */}
          <TouchableOpacity style={st.cardPurple} onPress={() => navigation.navigate('Tareas')} activeOpacity={0.88}>
            {/* Icono decorativo de fondo */}
            <Ionicons name="checkmark-circle" size={90} color="rgba(255,255,255,0.08)" style={st.bgIcon} />
            {/* Contenido */}
            <Text style={st.cardLabel}>Progreso</Text>
            <Text style={st.cardBigNumber}>{completedPct}%</Text>
            <Text style={st.cardSubNumber}>completado</Text>
            <View style={st.cardDividerWhite} />
            <View style={st.cardRow}>
              <View style={st.cardStat}>
                <Text style={st.cardStatNum}>{completedTasks.length}</Text>
                <Text style={st.cardStatLabel}>Listas ✅</Text>
              </View>
              <View style={st.cardStat}>
                <Text style={st.cardStatNum}>{pendingTasks.length}</Text>
                <Text style={st.cardStatLabel}>Pendientes</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* GASTOS — coral */}
          <TouchableOpacity style={st.cardCoral} onPress={() => navigation.navigate('Gastos')} activeOpacity={0.88}>
            {/* Icono decorativo de fondo */}
            <Ionicons name="wallet" size={90} color="rgba(255,255,255,0.12)" style={st.bgIcon} />
            {/* Contenido */}
            <Text style={st.cardLabelCoral}>Gastos del mes</Text>
            <Text style={st.cardBigNumberCoral} numberOfLines={1}>${totalExpenses.toLocaleString()}</Text>
            <Text style={st.cardSubNumberCoral}>{expenses.length} movimientos</Text>
            <View style={st.cardDividerCoral} />
            <View style={st.cardRow}>
              <View style={st.cardStat}>
                <Text style={st.cardStatNumCoral}>{topCatName || '—'}</Text>
                <Text style={st.cardStatLabelCoral}>Top categoría</Text>
              </View>
              <View style={st.cardStat}>
                <Text style={st.cardStatNumCoral} numberOfLines={1}>${topCatAmount.toLocaleString()}</Text>
                <Text style={st.cardStatLabelCoral}>Monto</Text>
              </View>
            </View>
          </TouchableOpacity>

        </AnimatedCard>

        {/* PREVIEW SECTION */}
        <AnimatedCard delay={350} style={st.previewSection}>

          <TouchableOpacity style={st.previewRow} onPress={() => navigation.navigate('Recordatorios')}>
            <View style={[st.previewIcon, { backgroundColor: C.purpleLight }]}>
              <Ionicons name="notifications-outline" size={17} color={C.purple} />
            </View>
            <View style={st.previewText}>
              <Text style={st.previewLabel}>Recordatorios</Text>
              <Text style={st.previewValue} numberOfLines={1}>
                {nextReminder ? (nextReminder.title || nextReminder.message) : 'Sin recordatorios pendientes'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={C.muted} />
          </TouchableOpacity>

          <View style={st.divider} />

          <TouchableOpacity style={st.previewRow} onPress={() => navigation.navigate('Tareas')}>
            <View style={[st.previewIcon, { backgroundColor: C.greenLight }]}>
              <Ionicons name="checkmark-circle-outline" size={17} color={C.green} />
            </View>
            <View style={st.previewText}>
              <Text style={st.previewLabel}>Tareas</Text>
              <Text style={st.previewValue} numberOfLines={1}>
                {nextTask ? nextTask.title : '¡Todo al día! 🎉'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={C.muted} />
          </TouchableOpacity>

          <View style={st.divider} />

          <TouchableOpacity style={st.previewRow} onPress={() => navigation.navigate('Cumpleaños')}>
            <View style={[st.previewIcon, { backgroundColor: C.peachLight }]}>
              <Ionicons name="gift-outline" size={17} color={C.peach} />
            </View>
            <View style={st.previewText}>
              <Text style={st.previewLabel}>Cumpleaños</Text>
              <Text style={st.previewValue} numberOfLines={1}>
                {nextBirthday
                  ? `${nextBirthday.person_name} — ${daysUntilBirthday(nextBirthday.birth_date) === 0 ? '¡Hoy! 🎉' : daysUntilBirthday(nextBirthday.birth_date) === 1 ? 'mañana' : `en ${daysUntilBirthday(nextBirthday.birth_date)} días`}`
                  : 'Sin cumpleaños registrados'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={C.muted} />
          </TouchableOpacity>

        </AnimatedCard>

      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.purple },
  container:   { flex: 1, backgroundColor: C.bg },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  loadingText: { marginTop: 10, color: C.muted, fontSize: 14, fontFamily: fonts.regular },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingTop: 14, paddingHorizontal: 20, paddingBottom: 26,
    backgroundColor: C.purple, borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  logo:     { fontSize: 10, fontFamily: fonts.semibold, color: 'rgba(255,255,255,0.5)', letterSpacing: 3, marginBottom: 3 },
  greeting: { fontSize: 22, fontFamily: fonts.bold, color: '#FFF' },
  subtitle: { fontSize: 12, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.7)' },

  statsRow: { flexDirection: 'row', paddingHorizontal: 12, marginTop: -16, gap: 6 },
  statCard: {
    borderRadius: 14, paddingVertical: 13, paddingHorizontal: 6, alignItems: 'center',
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4,
  },
  statNumber: { fontSize: 17, fontFamily: fonts.bold, marginTop: 3 },
  statLabel:  { fontSize: 9, color: C.textSec, marginTop: 1, textAlign: 'center', fontFamily: fonts.medium },

  dashRow: { flexDirection: 'row', marginTop: 10, marginHorizontal: 12, gap: 8, flex: 1 },

  // Tarjeta morada
  cardPurple: {
    flex: 1, borderRadius: 20, padding: 16, overflow: 'hidden',
    backgroundColor: C.purple, justifyContent: 'space-between',
    shadowColor: C.purple, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  // Tarjeta coral
  cardCoral: {
    flex: 1, borderRadius: 20, padding: 16, overflow: 'hidden',
    backgroundColor: '#F97455', justifyContent: 'space-between',
    shadowColor: '#F97455', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },

  bgIcon: { position: 'absolute', bottom: -10, right: -10 },

  cardLabel:         { fontSize: 11, fontFamily: fonts.semibold, color: 'rgba(255,255,255,0.75)' },
  cardBigNumber:     { fontSize: 38, fontFamily: fonts.bold, color: '#FFF', marginTop: 4 },
  cardSubNumber:     { fontSize: 11, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.65)', marginTop: -4 },
  cardDividerWhite:  { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 10 },

  cardLabelCoral:      { fontSize: 11, fontFamily: fonts.semibold, color: 'rgba(255,255,255,0.85)' },
  cardBigNumberCoral:  { fontSize: 28, fontFamily: fonts.bold, color: '#FFF', marginTop: 4 },
  cardSubNumberCoral:  { fontSize: 11, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.7)', marginTop: -2 },
  cardDividerCoral:    { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 10 },

  cardRow:          { flexDirection: 'row', justifyContent: 'space-between' },
  cardStat:         { alignItems: 'flex-start' },
  cardStatNum:      { fontSize: 15, fontFamily: fonts.bold, color: '#FFF' },
  cardStatLabel:    { fontSize: 9, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  cardStatNumCoral: { fontSize: 13, fontFamily: fonts.bold, color: '#FFF' },
  cardStatLabelCoral: { fontSize: 9, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.7)', marginTop: 1 },

  previewSection: {
    marginTop: 10, marginHorizontal: 12, marginBottom: 10,
    backgroundColor: C.white, borderRadius: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    overflow: 'hidden', flex: 1, justifyContent: 'space-evenly',
  },
  previewRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, flex: 1 },
  previewIcon:  { width: 34, height: 34, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  previewText:  { flex: 1 },
  previewLabel: { fontSize: 10, fontFamily: fonts.medium, color: C.muted, marginBottom: 2 },
  previewValue: { fontSize: 14, fontFamily: fonts.semibold, color: C.text },
  divider:      { height: 1, backgroundColor: C.bg, marginHorizontal: 16 },
});
