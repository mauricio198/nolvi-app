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

export default function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { const d = await api.getTasks(); setTasks(Array.isArray(d) ? d : []); }
    catch (e) { console.log(e); } finally { setLoading(false); }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const handleCreate = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Escribe una tarea');
    setSaving(true);
    try { await api.createTask({ title: title.trim() }); setTitle(''); setShowModal(false); load(); }
    catch (e) { Alert.alert('Error', 'No se pudo crear'); } finally { setSaving(false); }
  };

  const handleComplete = async (id) => {
    try { await api.completeTask(id); load(); } catch (e) { Alert.alert('Error', 'No se pudo completar'); }
  };

  const handleDelete = (id) => {
    Alert.alert('Eliminar', '¿Seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { try { await api.deleteTask(id); load(); } catch (e) {} } },
    ]);
  };

  const pending = tasks.filter(t => !t.is_completed);
  const completed = tasks.filter(t => t.is_completed);

  const renderItem = ({ item }) => (
    <View style={[styles.card, item.is_completed && styles.cardDone]}>
      <TouchableOpacity onPress={() => !item.is_completed && handleComplete(item.id)} style={styles.checkbox}>
        <View style={[styles.checkCircle, item.is_completed && styles.checkDone]}>
          {item.is_completed && <Ionicons name="checkmark" size={14} color="#FFF" />}
        </View>
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardText, item.is_completed && styles.textDone]}>{item.title}</Text>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="trash-outline" size={20} color={C.danger} />
      </TouchableOpacity>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2ECC71" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Ionicons name="checkmark-circle" size={24} color="#FFF" />
          <Text style={styles.headerTitle}>Tareas</Text>
        </View>
        <Text style={styles.headerCount}>{pending.length} pendientes</Text>
      </View>
      <FlatList data={[...pending, ...completed]} keyExtractor={(it, i) => it.id?.toString() || i.toString()} renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={<View style={styles.emptyWrap}><Ionicons name="clipboard-outline" size={48} color={C.muted} /><Text style={styles.emptyText}>Sin tareas</Text><Text style={styles.emptySubText}>Toca + para crear una</Text></View>}
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
              <Text style={styles.modalTitle}>Nueva tarea</Text>
              <Text style={styles.inputLabel}>¿Qué necesitas hacer?</Text>
              <TextInput style={styles.input} placeholder="Ej: Comprar mercado" value={title} onChangeText={setTitle} placeholderTextColor={C.muted} />
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

const MINT = '#2ECC71';
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  header: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: MINT, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  headerCount: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  card: { backgroundColor: C.white, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  cardDone: { opacity: 0.5 },
  checkbox: { marginRight: 12 },
  checkCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: MINT, justifyContent: 'center', alignItems: 'center' },
  checkDone: { backgroundColor: MINT, borderColor: MINT },
  cardText: { fontSize: 15, fontWeight: '600', color: C.text },
  textDone: { textDecorationLine: 'line-through', color: C.muted },
  emptyWrap: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, color: C.textSec, marginTop: 12, fontWeight: '600' },
  emptySubText: { fontSize: 14, color: C.muted, marginTop: 4 },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: MINT, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: MINT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalScroll: { flexGrow: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.cardBorder, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: C.text, marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: C.textSec, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: C.cardBorder, borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 16, color: C.text, backgroundColor: C.bg },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  cancelBtn: { flex: 1, marginRight: 8, padding: 14, borderRadius: 12, backgroundColor: C.bg, alignItems: 'center' },
  cancelTxt: { color: C.textSec, fontWeight: '600' },
  saveBtn: { flex: 1, marginLeft: 8, padding: 14, borderRadius: 12, backgroundColor: MINT, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  saveTxt: { color: '#FFF', fontWeight: '600' },
});
