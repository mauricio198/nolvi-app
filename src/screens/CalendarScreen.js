import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import C, { fonts } from '../theme';

const { width: W } = Dimensions.get('window');
const DAY_SIZE = Math.floor((W - 32) / 7);

const DAYS_ES  = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// Devuelve YYYY-MM-DD en hora local
const toLocalDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const todayKey = () => toLocalDate(new Date().toISOString().replace('Z',''));

export default function CalendarScreen({ navigation }) {
  const now = new Date();
  const [year, setYear]       = useState(now.getFullYear());
  const [month, setMonth]     = useState(now.getMonth()); // 0-based
  const [selected, setSelected] = useState(todayKey());
  const [reminders, setReminders] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = async () => {
    try {
      const [r, b, t] = await Promise.all([
        api.getReminders().catch(() => []),
        api.getBirthdays().catch(() => []),
        api.getTasks().catch(() => []),
      ]);
      setReminders(Array.isArray(r) ? r : []);
      setBirthdays(Array.isArray(b) ? b : []);
      setTasks(Array.isArray(t) ? t : []);
    } catch (e) {}
    finally { setLoading(false); }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  // ── Navegación de mes ──────────────────────────────────────────────────────
  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  // ── Construir días del mes ────────────────────────────────────────────────
  const firstDay = new Date(year, month, 1).getDay(); // 0=Dom
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  // ── Eventos por día ────────────────────────────────────────────────────────
  const eventMap = {}; // key: YYYY-MM-DD → [{type, label, color}]

  const addEvent = (key, evt) => {
    if (!key) return;
    if (!eventMap[key]) eventMap[key] = [];
    eventMap[key].push(evt);
  };

  // Recordatorios
  reminders.forEach(r => {
    const key = toLocalDate(r.remind_at);
    addEvent(key, { type: 'reminder', label: r.title || r.message, color: C.purple, icon: 'notifications-outline' });
  });

  // Tareas con due_date
  tasks.filter(t => t.due_date && !t.is_completed).forEach(t => {
    const key = t.due_date; // ya es YYYY-MM-DD
    addEvent(key, { type: 'task', label: t.title, color: C.green, icon: 'checkmark-circle-outline' });
  });

  // Cumpleaños — calcular la fecha de este año Y del siguiente
  birthdays.forEach(b => {
    const bd = new Date(b.birth_date);
    [year, year + 1].forEach(y => {
      try {
        const d = new Date(y, bd.getMonth(), bd.getDate());
        const key = `${y}-${String(bd.getMonth()+1).padStart(2,'0')}-${String(bd.getDate()).padStart(2,'0')}`;
        addEvent(key, { type: 'birthday', label: `🎂 ${b.person_name}`, color: C.coral, icon: 'gift-outline' });
      } catch (e) {}
    });
  });

  // ── Eventos del día seleccionado ───────────────────────────────────────────
  const selectedEvents = eventMap[selected] || [];

  const today = todayKey();

  const fmtTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const fmtSelectedLabel = () => {
    if (!selected) return '';
    const [y, m, d] = selected.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  if (loading) return <View style={st.center}><ActivityIndicator size="large" color={C.purple} /></View>;

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={st.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={st.headerTitle}>Calendario</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* NAVEGACIÓN DE MES */}
        <View style={st.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={st.navBtn}>
            <Ionicons name="chevron-back" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={st.monthLabel}>{MONTHS_ES[month]} {year}</Text>
          <TouchableOpacity onPress={nextMonth} style={st.navBtn}>
            <Ionicons name="chevron-forward" size={20} color={C.text} />
          </TouchableOpacity>
        </View>

        {/* CABECERA DÍAS */}
        <View style={st.weekHeader}>
          {DAYS_ES.map(d => (
            <Text key={d} style={[st.weekDay, d === 'Dom' && { color: C.coral }]}>{d}</Text>
          ))}
        </View>

        {/* GRID */}
        <View style={st.grid}>
          {cells.map((day, i) => {
            if (!day) return <View key={`e-${i}`} style={st.cell} />;
            const key = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const evts = eventMap[key] || [];
            const isToday    = key === today;
            const isSelected = key === selected;
            const isSunday   = (i % 7) === 0;
            // Tipos únicos para los dots
            const dotColors = [...new Set(evts.map(e => e.color))].slice(0, 3);
            return (
              <TouchableOpacity key={key} style={st.cell} onPress={() => setSelected(key)} activeOpacity={0.7}>
                <View style={[
                  st.dayCircle,
                  isSelected && { backgroundColor: C.purple },
                  isToday && !isSelected && { borderWidth: 1.5, borderColor: C.purple },
                ]}>
                  <Text style={[
                    st.dayNum,
                    isSunday && { color: C.coral },
                    isSelected && { color: '#FFF' },
                    isToday && !isSelected && { color: C.purple, fontFamily: fonts.bold },
                  ]}>{day}</Text>
                </View>
                {dotColors.length > 0 && (
                  <View style={st.dotRow}>
                    {dotColors.map((c, di) => (
                      <View key={di} style={[st.dot, { backgroundColor: c }]} />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* EVENTOS DEL DÍA SELECCIONADO */}
        <View style={st.eventsSection}>
          <Text style={st.eventsTitle} numberOfLines={1}>
            {fmtSelectedLabel()}
          </Text>

          {selectedEvents.length === 0 ? (
            <View style={st.emptyDay}>
              <Ionicons name="calendar-outline" size={36} color={C.muted} />
              <Text style={st.emptyDayText}>Sin eventos</Text>
            </View>
          ) : (
            selectedEvents.map((evt, i) => (
              <View key={i} style={[st.eventCard, { borderLeftColor: evt.color }]}>
                <View style={[st.eventIconWrap, { backgroundColor: evt.color + '20' }]}>
                  <Ionicons name={evt.icon} size={18} color={evt.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.eventLabel}>{evt.label}</Text>
                  {evt.type === 'reminder' && (() => {
                    const r = reminders.find(r => (r.title || r.message) === evt.label);
                    return r?.remind_at ? <Text style={st.eventTime}>{fmtTime(r.remind_at)}</Text> : null;
                  })()}
                </View>
              </View>
            ))
          )}
        </View>

        {/* LEYENDA */}
        <View style={st.legend}>
          {[
            { color: C.purple, label: 'Recordatorios' },
            { color: C.green,  label: 'Tareas' },
            { color: C.coral,  label: 'Cumpleaños' },
          ].map(l => (
            <View key={l.label} style={st.legendItem}>
              <View style={[st.legendDot, { backgroundColor: l.color }]} />
              <Text style={st.legendLabel}>{l.label}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.purple },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, backgroundColor: C.purple },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontFamily: fonts.bold, color: '#FFF' },

  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: C.white },
  navBtn:    { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 18, backgroundColor: C.bg },
  monthLabel:{ fontSize: 17, fontFamily: fonts.bold, color: C.text },

  weekHeader: { flexDirection: 'row', paddingHorizontal: 16, backgroundColor: C.white, paddingBottom: 6 },
  weekDay:    { width: DAY_SIZE, textAlign: 'center', fontSize: 11, fontFamily: fonts.semibold, color: C.muted },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, backgroundColor: C.white, paddingBottom: 12 },
  cell: { width: DAY_SIZE, alignItems: 'center', paddingVertical: 3 },
  dayCircle: { width: DAY_SIZE - 8, height: DAY_SIZE - 8, borderRadius: (DAY_SIZE - 8) / 2, justifyContent: 'center', alignItems: 'center' },
  dayNum:    { fontSize: 14, fontFamily: fonts.medium, color: C.text },
  dotRow:    { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot:       { width: 5, height: 5, borderRadius: 3 },

  eventsSection: { margin: 16, backgroundColor: C.white, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  eventsTitle:   { fontSize: 14, fontFamily: fonts.semibold, color: C.text, marginBottom: 12, textTransform: 'capitalize' },
  emptyDay:      { alignItems: 'center', paddingVertical: 20 },
  emptyDayText:  { fontSize: 14, fontFamily: fonts.regular, color: C.muted, marginTop: 8 },

  eventCard:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderLeftWidth: 3, paddingLeft: 12, marginBottom: 8, backgroundColor: C.bg, borderRadius: 8 },
  eventIconWrap: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  eventLabel:    { fontSize: 14, fontFamily: fonts.semibold, color: C.text },
  eventTime:     { fontSize: 12, fontFamily: fonts.regular, color: C.muted, marginTop: 2 },

  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingHorizontal: 16, paddingBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendLabel:{ fontSize: 11, fontFamily: fonts.regular, color: C.muted },
});
