import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import C, { fonts } from '../theme';

const CATS = [
  { key: 'Comida',          icon: 'fast-food-outline',        color: '#F97455' },
  { key: 'Transporte',      icon: 'car-outline',              color: '#5B8CF7' },
  { key: 'Servicios',       icon: 'phone-portrait-outline',   color: '#7C6AF7' },
  { key: 'Salud',           icon: 'medkit-outline',           color: '#2EC4B6' },
  { key: 'Entretenimiento', icon: 'game-controller-outline',  color: '#FFB347' },
  { key: 'Otro',            icon: 'cube-outline',             color: '#94A3B8' },
];
const CAT_MAP = Object.fromEntries(CATS.map(c => [c.key, c]));

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [desc, setDesc]     = useState('');
  const [amount, setAmount] = useState('');
  const [cat, setCat]       = useState('Otro');
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState(null); // null = todos

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

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  // Totales por categoría
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
          <Text style={st.headerTotal}>${total.toLocaleString()}</Text>
        </View>
      </View>

      {/* RESUMEN POR CATEGORÍA */}
      {catTotals.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.summaryRow}>
          <TouchableOpacity
            style={[st.summaryChip, !filterCat && st.summaryChipActive]}
            onPress={() => setFilterCat(null)}
          >
            <Text style={[st.summaryChipLabel, !filterCat && { color: '#FFF' }]}>Todos</Text>
            <Text style={[st.summaryChipAmount, !filterCat && { color: 'rgba(255,255,255,0.85)' }]}>${total.toLocaleString()}</Text>
          </TouchableOpacity>
          {catTotals.map(c => (
            <TouchableOpacity
              key={c.key}
              style={[st.summaryChip, filterCat === c.key && { backgroundColor: c.color, borderColor: c.color }]}
              onPress={() => setFilterCat(filterCat === c.key ? null : c.key)}
            >
              <View style={st.summaryChipRow}>
                <Ionicons name={c.icon} size={13} color={filterCat === c.key ? '#FFF' : c.color} />
                <Text style={[st.summaryChipLabel, filterCat === c.key && { color: '#FFF' }]}> {c.key}</Text>
              </View>
              <Text style={[st.summaryChipAmount, filterCat === c.key && { color: 'rgba(255,255,255,0.85)' }]}>${c.total.toLocaleString()}</Text>
              <Text style={[st.summaryChipCount, filterCat === c.key && { color: 'rgba(255,255,255,0.7)' }]}>{c.count} gasto{c.count !== 1 ? 's' : ''}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* LISTA */}
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
                  <TouchableOpacity
                    key={c.key}
                    style={[st.catBtn, cat === c.key && { backgroundColor: c.color, borderColor: c.color }]}
                    onPress={() => setCat(c.key)}
                  >
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

  summaryRow: { paddingHorizontal: 12, paddingVertical: 12, gap: 8, flexDirection: 'row' },
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
