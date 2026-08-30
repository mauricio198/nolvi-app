import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
// Platform kept for KeyboardAvoidingView behavior prop
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from '../components/DateTimePickerModal';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import C, { fonts } from '../theme';

export default function BirthdaysScreen() {
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [pickerDate, setPickerDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [advanceDays, setAdvanceDays] = useState(3);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    try { const d = await api.getBirthdays(); setBirthdays(Array.isArray(d) ? d : []); }
    catch (e) { console.log(e); } finally { setLoading(false); }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const openModal = () => {
    setName('');
    setPickerDate(new Date());
    setAdvanceDays(3);
    setEditingId(null);
    setShowModal(true);
  };

  const fmtDate = (d) => d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });

  // Calcula días hasta el próximo cumpleaños
  const daysUntil = (birthDateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bd = new Date(birthDateStr);
    let next = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
    if (next < today) next = new Date(today.getFullYear() + 1, bd.getMonth(), bd.getDate());
    const diff = Math.round((next - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const fmtBirthDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setName(item.person_name);
    setPickerDate(new Date(item.birth_date));
    setAdvanceDays(item.advance_days || 3);
    setShowModal(true);
  };

  const handleLongPress = (item) => {
    Alert.alert(item.person_name, '¿Qué quieres hacer?', [
      { text: 'Editar', onPress: () => openEdit(item) },
      { text: 'Eliminar', style: 'destructive', onPress: () => handleDelete(item.id) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleDelete = (id) => {
    Alert.alert('Eliminar', '¿Seguro que quieres eliminar este cumpleaños?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await api.deleteBirthday(id); load(); }
        catch (e) { Alert.alert('Error', 'No se pudo eliminar'); }
      }},
    ]);
  };

  const handleCreate = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Escribe el nombre');
    setSaving(true);
    try {
      const dateStr = pickerDate.toISOString().split('T')[0];
      if (editingId) {
        await api.updateBirthday(editingId, { person_name: name.trim(), birth_date: dateStr, advance_days: advanceDays });
      } else {
        await api.createBirthday({ person_name: name.trim(), birth_date: dateStr, advance_days: advanceDays });
      }
      setShowModal(false);
      setEditingId(null);
      load();
    } catch (e) { Alert.alert('Error', 'No se pudo guardar'); } finally { setSaving(false); }
  };

  const sortedBirthdays = [...birthdays].sort((a, b) => daysUntil(a.birth_date) - daysUntil(b.birth_date));

  const renderItem = ({ item }) => {
    const days = daysUntil(item.birth_date);
    const isSoon = days <= 7;
    return (
      <TouchableOpacity style={st.card} onLongPress={() => handleLongPress(item)} activeOpacity={0.8}>
        <View style={[st.iconCircle, isSoon && { backgroundColor: C.peachLight }]}>
          <Ionicons name="gift" size={20} color={isSoon ? C.peach : C.purple} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.cardText}>{item.person_name}</Text>
          <Text style={st.cardSub}>{fmtBirthDate(item.birth_date)}</Text>
        </View>
        <View style={st.daysBadge}>
          <Text style={[st.daysText, isSoon && { color: C.peach }]}>
            {days === 0 ? '¡Hoy!' : days === 1 ? 'Mañana' : `${days}d`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={st.center}><ActivityIndicator size="large" color={C.purple} /></View>;

  return (
    <View style={st.container}>
      <View style={st.header}>
        <View style={st.headerRow}>
          <Ionicons name="gift" size={24} color="#FFF" />
          <Text style={st.headerTitle}>Cumpleaños</Text>
        </View>
        <Text style={st.headerCount}>{birthdays.length} total</Text>
      </View>
      <FlatList data={sortedBirthdays} keyExtractor={(it, i) => it.id?.toString() || i.toString()} renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={<View style={st.emptyWrap}><Ionicons name="gift-outline" size={48} color={C.muted} /><Text style={st.emptyText}>Sin cumpleaños</Text><Text style={st.emptySubText}>Toca + para agregar uno</Text></View>} />
      <TouchableOpacity style={st.fab} onPress={openModal}>
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={st.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowModal(false)} />
          <ScrollView contentContainerStyle={st.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={st.modalContent}>
              <DateTimePickerModal
                visible={showPicker}
                value={pickerDate}
                mode="date"
                onConfirm={(date) => { setPickerDate(date); setShowPicker(false); }}
                onCancel={() => setShowPicker(false)}
                maximumDate={new Date()}
              />
              <View style={st.modalHandle} />
              <Text style={st.modalTitle}>Nuevo cumpleaños</Text>

              <Text style={st.inputLabel}>Nombre</Text>
              <TextInput style={st.input} placeholder="Ej: María" value={name} onChangeText={setName} placeholderTextColor={C.muted} />

              <Text style={st.inputLabel}>Fecha de nacimiento</Text>
              <TouchableOpacity style={st.pickerBtn} onPress={() => setShowPicker(true)}>
                <Ionicons name="calendar-outline" size={20} color={C.purple} />
                <Text style={st.pickerText}>{fmtDate(pickerDate)}</Text>
                <Ionicons name="chevron-down" size={16} color={C.muted} />
              </TouchableOpacity>

              <Text style={st.inputLabel}>Avisar con anticipación</Text>
              <View style={st.advanceRow}>
                {[1, 3, 7].map(d => (
                  <TouchableOpacity key={d} style={[st.advanceBtn, advanceDays === d && st.advanceActive]} onPress={() => setAdvanceDays(d)}>
                    <Text style={[st.advanceTxt, advanceDays === d && st.advanceTxtActive]}>{d} día{d > 1 ? 's' : ''}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={st.modalBtns}>
                <TouchableOpacity style={st.cancelBtn} onPress={() => setShowModal(false)}>
                  <Text style={st.cancelTxt}>Cancelar</Text>
                </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: C.bg }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  header: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: C.purple, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, headerTitle: { fontSize: 22, fontFamily: fonts.bold, color: '#FFF' }, headerCount: { fontSize: 14, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.7)' },
  card: { backgroundColor: C.white, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.purpleLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardText: { fontSize: 15, fontFamily: fonts.semibold, color: C.text }, cardSub: { fontSize: 12, fontFamily: fonts.regular, color: C.muted, marginTop: 3, textTransform: 'capitalize' },
  daysBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: C.bg },
  daysText: { fontSize: 12, fontFamily: fonts.semibold, color: C.purple },
  emptyWrap: { alignItems: 'center', marginTop: 80 }, emptyText: { fontSize: 18, color: C.textSec, marginTop: 12, fontFamily: fonts.semibold }, emptySubText: { fontSize: 14, color: C.muted, marginTop: 4, fontFamily: fonts.regular },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: C.purple, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: C.purple, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }, modalScroll: { flexGrow: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.cardBorder, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontFamily: fonts.bold, color: C.text, marginBottom: 20 },
  inputLabel: { fontSize: 13, fontFamily: fonts.semibold, color: C.textSec, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: C.cardBorder, borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 16, color: C.text, backgroundColor: C.bg, fontFamily: fonts.regular },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.cardBorder, borderRadius: 12, padding: 14, marginBottom: 16, backgroundColor: C.bg, gap: 10 },
  pickerText: { flex: 1, fontSize: 15, color: C.text, fontFamily: fonts.regular, textTransform: 'capitalize' },
  advanceRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  advanceBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: C.bg, borderWidth: 1, borderColor: C.cardBorder, alignItems: 'center' },
  advanceActive: { backgroundColor: C.purple, borderColor: C.purple },
  advanceTxt: { fontSize: 13, color: C.textSec, fontFamily: fonts.medium },
  advanceTxtActive: { color: '#FFF', fontFamily: fonts.semibold },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  cancelBtn: { flex: 1, marginRight: 8, padding: 14, borderRadius: 12, backgroundColor: C.bg, alignItems: 'center' }, cancelTxt: { color: C.textSec, fontFamily: fonts.semibold },
  saveBtn: { flex: 1, marginLeft: 8, padding: 14, borderRadius: 12, backgroundColor: C.purple, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }, saveTxt: { color: '#FFF', fontFamily: fonts.semibold },
});
