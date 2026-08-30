import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform,
  ScrollView, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import C, { fonts } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');

const CATS = [
  { key: 'Comida',          icon: 'fast-food-outline',       color: '#F97455' },
  { key: 'Transporte',      icon: 'car-outline',             color: '#5B8CF7' },
  { key: 'Servicios',       icon: 'phone-portrait-outline',  color: '#7C6AF7' },
  { key: 'Salud',           icon: 'medkit-outline',          color: '#2EC4B6' },
  { key: 'Entretenimiento', icon: 'game-controller-outline', color: '#FFB347' },
  { key: 'Otro',            icon: 'cube-outline',            color: '#94A3B8' },
];
const CAT_MAP = Object.fromEntries(CATS.map(c => [c.key, c]));

// ── Helpers ───────────────────────────────────────────────────────────────────
const expenseDate = (e) => new Date(e.expense_date || e.created_at || Date.now());

const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const startOfWeek  = (d) => { const c = new Date(d); c.setDate(c.getDate() - c.getDay()); c.setHours(0,0,0,0); return c; };
const addDays      = (d, n) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };

const fmt$ = (n) => {
  if (n >= 1_000_000) return `$${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n/1_000).toFixed(0)}k`;
  return `$${n}`;
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function ExpensesScreen() {
  const [expenses, setExpenses]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('lista'); // 'lista' | 'stats'
  const [showModal, setShowModal] = useState(false);
  const [desc, setDesc]           = useState('');
  const [amount, setAmount]       = useState('');
  const [cat, setCat]             = useState('Otro');
  const [saving, setSaving]       = useState(false);
  const [filterCat, setFilterCat] = useState(null);

  const load = async () => {
    try { const d = await api.getExpenses(); setExpenses(Array.isArray(d) ? d : []); }
    catch (e) {} finally { setLoading(false); }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const handleCreate = async () => {
    if (!desc.trim()) return Alert.alert('Error', 'Escribe una descripción');
    if (!amount.trim() || isNaN(Number(amount))) return Alert.alert('Error', 'Monto inválido');
    setSaving(true);
    try {
      await api.createExpense({ description: desc.trim(), amount: Number(amount), category: cat });
      setDesc(''); setAmount(''); setCat('Otro'); setShowModal(false); load();
    } catch (e) { Alert.alert('Error', 'No se pudo registrar'); } finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Eliminar', '¿Seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { try { await api.deleteExpense(id); load(); } catch (e) {} } },
    ]);
  };

  // ── Stats cómputos ────────────────────────────────────────────────────────
  const now       = new Date();
  const thisMonthStart = startOfMonth(now);
  const prevMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const thisMonth = expenses.filter(e => expenseDate(e) >= thisMonthStart);
  const prevMonth = expenses.filter(e => {
    const d = expenseDate(e);
    return d >= prevMonthStart && d < thisMonthStart;
  });

  const totalThis = thisMonth.reduce((s, e) => s + (e.amount || 0), 0);
  const totalPrev = prevMonth.reduce((s, e) => s + (e.amount || 0), 0);
  const totalAll  = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  const diff = totalPrev > 0 ? ((totalThis - totalPrev) / totalPrev) * 100 : null;

  // Por categoría (mes actual)
  const catStats = CATS.map(c => ({
    ...c,
    total: thisMonth.filter(e => (e.category || 'Otro') === c.key).reduce((s, e) => s + (e.amount || 0), 0),
    count: thisMonth.filter(e => (e.category || 'Otro') === c.key).length,
  })).filter(c => c.count > 0).sort((a, b) => b.total - a.total);

  const maxCatTotal = catStats.length ? catStats[0].total : 1;

  // Últimas 4 semanas
  const weeks = Array.from({ length: 4 }, (_, i) => {
    const start = startOfWeek(addDays(now, -7 * (3 - i)));
    const end   = addDays(start, 7);
    const total = expenses
      .filter(e => { const d = expenseDate(e); return d >= start && d < end; })
      .reduce((s, e) => s + (e.amount || 0), 0);
    const label = `${start.getDate()}/${start.getMonth() + 1}`;
    return { label, total, start };
  });
  const maxWeek = Math.max(...weeks.map(w => w.total), 1);

  // ── Lista ─────────────────────────────────────────────────────────────────
  const catTotals = CATS.map(c => ({
    ...c,
    total: expenses.filter(e => (e.category || 'Otro') === c.key).reduce((s, e) => s + (e.amount || 0), 0),
    count: expenses.filter(e => (e.category || 'Otro') === c.key).length,
  })).filter(c => c.count > 0);

  const filtered = filterCat ? expenses.filter(e => (e.category || 'Otro') === filterCat) : expenses;

  const renderItem = ({ item }) => {
    const cfg = CAT_MAP[item.category] || CAT_MAP['Otro'];
    return (
      <TouchableOpacity style={st.card} onLongPress={() => handleDelete(item.id)} activeOpacity={0.85}>
        <View style={[st.iconCircle, { backgroundColor: cfg.color + '20' }]}>
          <Ionicons name={cfg.icon} size={20} color={cfg.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.cardText}>{item.description}</Text>
          <Text style={[st.cardSub, { color: cfg.color }]}>{item.category || 'Sin categoría'}</Text>
        </View>
        <Text style={[st.cardAmount, { color: cfg.color }]}>${(item.amount || 0).toLocaleString()}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={st.center}><ActivityIndicator size="large" color={C.coral} /></View>;

  return (
    <View style={st.container}>
      {/* HEADER */}
      <View style={st.header}>
        <View>
          <View style={st.headerRow}><Ionicons name="wallet" size={24} color="#FFF" /><Text style={st.headerTitle}>Gastos</Text></View>
          <Text style={st.headerCount}>{expenses.length} registros</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={st.headerTotalLabel}>Total</Text>
          <Text style={st.headerTotal}>${totalAll.toLocaleString()}</Text>
        </View>
      </View>

      {/* TOGGLE */}
      <View style={st.toggleRow}>
        <TouchableOpacity style={[st.toggleBtn, tab === 'lista' && st.toggleActive]} onPress={() => setTab('lista')}>
          <Ionicons name="list-outline" size={15} color={tab === 'lista' ? C.coral : C.muted} />
          <Text style={[st.toggleTxt, tab === 'lista' && { color: C.coral }]}>  Lista</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[st.toggleBtn, tab === 'stats' && st.toggleActive]} onPress={() => setTab('stats')}>
          <Ionicons name="bar-chart-outline" size={15} color={tab === 'stats' ? C.coral : C.muted} />
          <Text style={[st.toggleTxt, tab === 'stats' && { color: C.coral }]}>  Estadísticas</Text>
        </TouchableOpacity>
      </View>

      {/* ── VISTA LISTA ── */}
      {tab === 'lista' && (
        <>
          {catTotals.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.summaryRow}>
              <TouchableOpacity style={[st.summaryChip, !filterCat && st.summaryChipActive]} onPress={() => setFilterCat(null)}>
                <Text style={[st.summaryChipLabel, !filterCat && { color: '#FFF' }]}>Todos</Text>
                <Text style={[st.summaryChipAmount, !filterCat && { color: 'rgba(255,255,255,0.85)' }]}>${totalAll.toLocaleString()}</Text>
              </TouchableOpacity>
              {catTotals.map(c => (
                <TouchableOpacity key={c.key} style={[st.summaryChip, filterCat === c.key && { backgroundColor: c.color, borderColor: c.color }]} onPress={() => setFilterCat(filterCat === c.key ? null : c.key)}>
                  <View style={st.summaryChipRow}><Ionicons name={c.icon} size={13} color={filterCat === c.key ? '#FFF' : c.color} /><Text style={[st.summaryChipLabel, filterCat === c.key && { color: '#FFF' }]}> {c.key}</Text></View>
                  <Text style={[st.summaryChipAmount, filterCat === c.key && { color: 'rgba(255,255,255,0.85)' }]}>${c.total.toLocaleString()}</Text>
                  <Text style={[st.summaryChipCount, filterCat === c.key && { color: 'rgba(255,255,255,0.7)' }]}>{c.count} gasto{c.count !== 1 ? 's' : ''}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          <FlatList
            data={filtered}
            keyExtractor={(it, i) => it.id?.toString() || i.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            ListEmptyComponent={
              <View style={st.emptyWrap}>
                <Ionicons name="wallet-outline" size={48} color={C.muted} />
                <Text style={st.emptyText}>{filterCat ? `Sin gastos en ${filterCat}` : 'Sin gastos'}</Text>
                <Text style={st.emptySubText}>Toca + para registrar uno</Text>
              </View>
            }
          />
        </>
      )}

      {/* ── VISTA ESTADÍSTICAS ── */}
      {tab === 'stats' && (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>

          {/* Resumen mensual */}
          <Text style={st.sectionTitle}>Este mes</Text>
          <View style={st.monthRow}>
            <View style={[st.monthCard, { flex: 1, marginRight: 8 }]}>
              <Text style={st.monthCardLabel}>
                {now.toLocaleDateString('es-CO', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())}
              </Text>
              <Text style={st.monthCardAmount}>${totalThis.toLocaleString()}</Text>
              <Text style={st.monthCardSub}>{thisMonth.length} gastos</Text>
            </View>
            <View style={[st.monthCard, { flex: 1, marginLeft: 8 }]}>
              <Text style={st.monthCardLabel}>Mes anterior</Text>
              <Text style={[st.monthCardAmount, { color: C.muted }]}>${totalPrev.toLocaleString()}</Text>
              <Text style={st.monthCardSub}>{prevMonth.length} gastos</Text>
            </View>
          </View>

          {diff !== null && (
            <View style={[st.diffBanner, { backgroundColor: diff <= 0 ? '#DCFCE7' : '#FEE2E2' }]}>
              <Ionicons name={diff <= 0 ? 'trending-down' : 'trending-up'} size={18} color={diff <= 0 ? '#16A34A' : '#DC2626'} />
              <Text style={[st.diffText, { color: diff <= 0 ? '#16A34A' : '#DC2626' }]}>
                {'  '}{diff <= 0 ? 'Gastaste' : 'Gastaste'} {Math.abs(diff).toFixed(1)}% {diff <= 0 ? 'menos' : 'más'} que el mes pasado
              </Text>
            </View>
          )}

          {/* Barras por semana */}
          <Text style={[st.sectionTitle, { marginTop: 24 }]}>Últimas 4 semanas</Text>
          <View style={st.weekChart}>
            {weeks.map((w, i) => {
              const barH = maxWeek > 0 ? Math.max((w.total / maxWeek) * 100, w.total > 0 ? 6 : 0) : 0;
              const isThis = i === 3;
              return (
                <View key={i} style={st.weekCol}>
                  <Text style={st.weekAmt}>{w.total > 0 ? fmt$(w.total) : ''}</Text>
                  <View style={st.weekBarBg}>
                    <View style={[st.weekBar, { height: `${barH}%`, backgroundColor: isThis ? C.coral : C.coral + '60' }]} />
                  </View>
                  <Text style={[st.weekLabel, isThis && { color: C.coral, fontFamily: fonts.semibold }]}>{w.label}</Text>
                </View>
              );
            })}
          </View>

          {/* Barras por categoría */}
          {catStats.length > 0 && (
            <>
              <Text style={[st.sectionTitle, { marginTop: 24 }]}>Por categoría — este mes</Text>
              <View style={st.catStatsCard}>
                {catStats.map(c => {
                  const pct = totalThis > 0 ? (c.total / totalThis) * 100 : 0;
                  const barW = maxCatTotal > 0 ? (c.total / maxCatTotal) * 100 : 0;
                  return (
                    <View key={c.key} style={st.catStatRow}>
                      <View style={st.catStatLeft}>
                        <View style={[st.catDot, { backgroundColor: c.color }]} />
                        <Text style={st.catStatName}>{c.key}</Text>
                      </View>
                      <View style={st.catBarWrap}>
                        <View style={[st.catBar, { width: `${barW}%`, backgroundColor: c.color + 'CC' }]} />
                      </View>
                      <View style={st.catStatRight}>
                        <Text style={[st.catStatAmt, { color: c.color }]}>${c.total.toLocaleString()}</Text>
                        <Text style={st.catStatPct}>{pct.toFixed(0)}%</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {expenses.length === 0 && (
            <View style={st.emptyWrap}>
              <Ionicons name="bar-chart-outline" size={48} color={C.muted} />
              <Text style={st.emptyText}>Sin datos aún</Text>
              <Text style={st.emptySubText}>Registra gastos para ver tus estadísticas</Text>
            </View>
          )}
        </ScrollView>
      )}

      <TouchableOpacity style={st.fab} onPress={() => setShowModal(true)}>
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>

      {/* MODAL CREAR */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={st.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowModal(false)} />
          <ScrollView contentContainerStyle={st.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={st.modalContent}>
              <View style={st.modalHandle} />
              <Text style={st.modalTitle}>Registrar gasto</Text>
              <Text style={st.inputLabel}>¿En qué gastaste?</Text>
              <TextInput style={st.input} placeholder="Ej: Almuerzo" value={desc} onChangeText={setDesc} placeholderTextColor={C.muted} />
              <Text style={st.inputLabel}>Monto</Text>
              <TextInput style={st.input} placeholder="25000" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholderTextColor={C.muted} />
              <Text style={st.inputLabel}>Categoría</Text>
              <View style={st.catGrid}>
                {CATS.map(c => (
                  <TouchableOpacity key={c.key} style={[st.catBtn, cat === c.key && { backgroundColor: c.color, borderColor: c.color }]} onPress={() => setCat(c.key)}>
                    <Ionicons name={c.icon} size={18} color={cat === c.key ? '#FFF' : c.color} />
                    <Text style={[st.catTxt, cat === c.key && { color: '#FFF', fontFamily: fonts.semibold }]}>{c.key}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={st.modalBtns}>
                <TouchableOpacity style={st.cancelBtn} onPress={() => setShowModal(false)}><Text style={st.cancelTxt}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity style={st.saveBtn} onPress={handleCreate} disabled={saving}>
                  <Ionicons name="checkmark" size={18} color="#FFF" />
                  <Text style={st.saveTxt}>{saving ? 'Guardando...' : ' Guardar'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

  header: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: C.coral, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 22, fontFamily: fonts.bold, color: '#FFF' },
  headerCount: { fontSize: 12, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerTotalLabel: { fontSize: 11, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.7)' },
  headerTotal: { fontSize: 22, fontFamily: fonts.bold, color: '#FFF' },

  toggleRow: { flexDirection: 'row', margin: 16, marginBottom: 4, backgroundColor: C.white, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: C.cardBorder },
  toggleBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 8, borderRadius: 9 },
  toggleActive: { backgroundColor: C.coral + '18' },
  toggleTxt: { fontSize: 13, fontFamily: fonts.semibold, color: C.muted },

  summaryRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  summaryChip: { backgroundColor: C.white, borderRadius: 14, padding: 12, minWidth: 100, borderWidth: 1.5, borderColor: C.cardBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  summaryChipActive: { backgroundColor: C.coral, borderColor: C.coral },
  summaryChipRow: { flexDirection: 'row', alignItems: 'center' },
  summaryChipLabel: { fontSize: 12, fontFamily: fonts.semibold, color: C.text },
  summaryChipAmount: { fontSize: 15, fontFamily: fonts.bold, color: C.text, marginTop: 4 },
  summaryChipCount: { fontSize: 10, fontFamily: fonts.regular, color: C.muted, marginTop: 2 },

  card: { backgroundColor: C.white, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardText:   { fontSize: 15, fontFamily: fonts.semibold, color: C.text },
  cardSub:    { fontSize: 12, fontFamily: fonts.medium, marginTop: 2 },
  cardAmount: { fontSize: 16, fontFamily: fonts.bold },

  // Stats
  sectionTitle: { fontSize: 14, fontFamily: fonts.semibold, color: C.textSec, marginBottom: 10 },

  monthRow: { flexDirection: 'row', marginBottom: 10 },
  monthCard: { backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.cardBorder },
  monthCardLabel:  { fontSize: 12, fontFamily: fonts.regular, color: C.muted },
  monthCardAmount: { fontSize: 20, fontFamily: fonts.bold, color: C.text, marginTop: 4 },
  monthCardSub:    { fontSize: 11, fontFamily: fonts.regular, color: C.muted, marginTop: 2 },

  diffBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 4 },
  diffText:   { fontSize: 13, fontFamily: fonts.medium },

  weekChart: { backgroundColor: C.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBorder, flexDirection: 'row', alignItems: 'flex-end', height: 160, gap: 8 },
  weekCol:   { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  weekAmt:   { fontSize: 10, fontFamily: fonts.medium, color: C.textSec, marginBottom: 4, textAlign: 'center' },
  weekBarBg: { width: '70%', flex: 1, justifyContent: 'flex-end' },
  weekBar:   { width: '100%', borderRadius: 6, minHeight: 4 },
  weekLabel: { fontSize: 11, fontFamily: fonts.regular, color: C.muted, marginTop: 6 },

  catStatsCard: { backgroundColor: C.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBorder, gap: 14 },
  catStatRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catStatLeft:  { flexDirection: 'row', alignItems: 'center', width: 110, gap: 6 },
  catDot:       { width: 10, height: 10, borderRadius: 5 },
  catStatName:  { fontSize: 13, fontFamily: fonts.medium, color: C.text, flexShrink: 1 },
  catBarWrap:   { flex: 1, height: 8, backgroundColor: C.bg, borderRadius: 4, overflow: 'hidden' },
  catBar:       { height: 8, borderRadius: 4 },
  catStatRight: { width: 70, alignItems: 'flex-end' },
  catStatAmt:   { fontSize: 12, fontFamily: fonts.bold },
  catStatPct:   { fontSize: 10, fontFamily: fonts.regular, color: C.muted },

  emptyWrap:   { alignItems: 'center', marginTop: 60 },
  emptyText:   { fontSize: 18, color: C.textSec, marginTop: 12, fontFamily: fonts.semibold },
  emptySubText:{ fontSize: 14, color: C.muted, marginTop: 4, fontFamily: fonts.regular },

  fab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: C.coral, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: C.coral, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalScroll:  { flexGrow: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: C.cardBorder, alignSelf: 'center', marginBottom: 16 },
  modalTitle:   { fontSize: 20, fontFamily: fonts.bold, color: C.text, marginBottom: 20 },
  inputLabel:   { fontSize: 13, fontFamily: fonts.semibold, color: C.textSec, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: C.cardBorder, borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 16, color: C.text, backgroundColor: C.bg, fontFamily: fonts.regular },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.cardBorder },
  catTxt:  { fontSize: 13, color: C.textSec, fontFamily: fonts.medium },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  cancelBtn: { flex: 1, marginRight: 8, padding: 14, borderRadius: 12, backgroundColor: C.bg, alignItems: 'center' },
  cancelTxt: { color: C.textSec, fontFamily: fonts.semibold },
  saveBtn:   { flex: 1, marginLeft: 8, padding: 14, borderRadius: 12, backgroundColor: C.coral, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  saveTxt:   { color: '#FFF', fontFamily: fonts.semibold },
});
