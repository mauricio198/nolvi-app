import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import C from '../theme';

const CATS = [
  { key: 'Comida', icon: 'fast-food-outline' },
  { key: 'Transporte', icon: 'car-outline' },
  { key: 'Servicios', icon: 'phone-portrait-outline' },
  { key: 'Salud', icon: 'medkit-outline' },
  { key: 'Entretenimiento', icon: 'game-controller-outline' },
  { key: 'Otro', icon: 'cube-outline' },
];
const CAT_ICON = Object.fromEntries(CATS.map(c => [c.key, c.icon]));

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState('Otro');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { const d = await api.getExpenses(); setExpenses(Array.isArray(d) ? d : []); }
    catch (e) { console.log(e); } finally { setLoading(false); }
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

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Ionicons name={CAT_ICON[item.category] || 'cube-outline'} size={20} color={C.peach} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardText}>{item.description}</Text>
        <Text style={styles.cardSub}>{item.category || 'Sin categoría'}</Text>
      </View>
      <Text style={styles.cardAmount}>${(item.amount || 0).toLocaleString()}</Text>
      <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ marginLeft: 8 }}>
        <Ionicons name="trash-outline" size={18} color={C.danger} />
      </TouchableOpacity>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={C.peach} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <View style={styles.headerRow}>
            <Ionicons name="wallet" size={24} color="#FFF" />
            <Text style={styles.headerTitle}>Gastos</Text>
          </View>
          <Text style={styles.headerCount}>{expenses.length} registros</Text>
        </View>
        <Text style={styles.headerTotal}>${total.toLocaleString()}</Text>
      </View>
      <FlatList data={expenses} keyExtractor={(it, i) => it.id?.toString() || i.toString()} renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={<View style={styles.emptyWrap}><Ionicons name="wallet-outline" size={48} color={C.muted} /><Text style={styles.emptyText}>Sin gastos</Text><Text style={styles.emptySubText}>Toca + para registrar uno</Text></View>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowModal(false)} />
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Registrar gasto</Text>
              <Text style={styles.inputLabel}>¿En qué gastaste?</Text>
              <TextInput style={styles.input} placeholder="Ej: Almuerzo" value={desc} onChangeText={setDesc} placeholderTextColor={C.muted} />
              <Text style={styles.inputLabel}>Monto</Text>
              <TextInput style={styles.input} placeholder="25000" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholderTextColor={C.muted} />
              <Text style={styles.inputLabel}>Categoría</Text>
              <View style={styles.catRow}>
                {CATS.map(c => (
                  <TouchableOpacity key={c.key} style={[styles.catBtn, cat === c.key && styles.catActive]} onPress={() => setCat(c.key)}>
                    <Ionicons name={c.icon} size={16} color={cat === c.key ? '#FFF' : C.textSec} />
                    <Text style={[styles.catTxt, cat === c.key && styles.catTxtActive]}> {c.key}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                  <Text style={styles.cancelTxt}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleCreate} disabled={saving}>
                  <Ionicons name="checkmark" size={18} color="#FFF" />
                  <Text style={styles.saveTxt}>{saving ? 'Guardando...' : ' Guardar'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  header: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: C.peach, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  headerCount: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerTotal: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  card: { backgroundColor: C.white, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.peachLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardText: { fontSize: 15, fontWeight: '600', color: C.text },
  cardSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  cardAmount: { fontSize: 16, fontWeight: 'bold', color: C.peach },
  emptyWrap: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, color: C.textSec, marginTop: 12, fontWeight: '600' },
  emptySubText: { fontSize: 14, color: C.muted, marginTop: 4 },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: C.peach, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: C.peach, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalScroll: { flexGrow: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.cardBorder, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: C.text, marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: C.textSec, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: C.cardBorder, borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 16, color: C.text, backgroundColor: C.bg },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1, borderColor: C.cardBorder },
  catActive: { backgroundColor: C.peach, borderColor: C.peach },
  catTxt: { fontSize: 12, color: C.textSec },
  catTxtActive: { color: '#FFF', fontWeight: '600' },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  cancelBtn: { flex: 1, marginRight: 8, padding: 14, borderRadius: 12, backgroundColor: C.bg, alignItems: 'center' },
  cancelTxt: { color: C.textSec, fontWeight: '600' },
  saveBtn: { flex: 1, marginLeft: 8, padding: 14, borderRadius: 12, backgroundColor: C.peach, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  saveTxt: { color: '#FFF', fontWeight: '600' },
});
