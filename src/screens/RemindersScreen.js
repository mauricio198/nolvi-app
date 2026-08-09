import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import C from '../theme';

export default function RemindersScreen() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [pickerDate, setPickerDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { const d = await api.getReminders(); setReminders(Array.isArray(d) ? d : []); }
    catch (e) { console.log(e); } finally { setLoading(false); }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const openModal = () => {
    setTitle('');
    setPickerDate(new Date());
    setShowModal(true);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const updated = new Date(pickerDate);
      updated.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setPickerDate(updated);
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const updated = new Date(pickerDate);
      updated.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
      setPickerDate(updated);
    }
  };

  const formatDate = (d) => d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const formatTime = (d) => d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });

  const handleCreate = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Escribe un recordatorio');
    if (pickerDate <= new Date()) return Alert.alert('Error', 'La fecha debe ser en el futuro');
    setSaving(true);
    try {
      await api.createReminder({ title: title.trim(), remind_at: pickerDate.toISOString() });
      setShowModal(false);
      load();
    } catch (e) { Alert.alert('Error', 'No se pudo crear'); } finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Eliminar', '¿Seguro que quieres eliminar este recordatorio?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { try { await api.deleteReminder(id); load(); } catch (e) {} } },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Ionicons name="notifications" size={20} color={C.iris} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardText}>{item.title || item.message}</Text>
        <Text style={styles.cardSub}>
          <Ionicons name="time-outline" size={12} color={C.muted} />{' '}
          {item.remind_at ? new Date(item.remind_at).toLocaleString('es-CO') : 'Sin fecha'}
        </Text>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="trash-outline" size={20} color={C.danger} />
      </TouchableOpacity>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={C.iris} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Ionicons name="notifications" size={24} color="#FFF" />
          <Text style={styles.headerTitle}>Recordatorios</Text>
        </View>
        <Text style={styles.headerCount}>{reminders.length} total</Text>
      </View>
      <FlatList data={reminders} keyExtractor={(it, i) => it.id?.toString() || i.toString()} renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={<View style={styles.emptyWrap}><Ionicons name="notifications-off-outline" size={48} color={C.muted} /><Text style={styles.emptyText}>Sin recordatorios</Text><Text style={styles.emptySubText}>Toca + para crear uno</Text></View>}
      />
      <TouchableOpacity style={styles.fab} onPress={openModal}>
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowModal(false)} />
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Nuevo recordatorio</Text>

              <Text style={styles.inputLabel}>¿Qué quieres recordar?</Text>
              <TextInput style={styles.input} placeholder="Ej: Pagar internet" value={title} onChangeText={setTitle} placeholderTextColor={C.muted} />

              <Text style={styles.inputLabel}>Fecha</Text>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar-outline" size={20} color={C.iris} />
                <Text style={styles.pickerText}>{formatDate(pickerDate)}</Text>
                <Ionicons name="chevron-down" size={16} color={C.muted} />
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Hora</Text>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTimePicker(true)}>
                <Ionicons name="time-outline" size={20} color={C.iris} />
                <Text style={styles.pickerText}>{formatTime(pickerDate)}</Text>
                <Ionicons name="chevron-down" size={16} color={C.muted} />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={pickerDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date()}
                  onChange={onDateChange}
                  locale="es-CO"
                />
              )}
              {showTimePicker && (
                <DateTimePicker
                  value={pickerDate}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onTimeChange}
                  locale="es-CO"
                />
              )}

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
  header: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: C.iris, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  headerCount: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  card: { backgroundColor: C.white, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.irisLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardText: { fontSize: 15, fontWeight: '600', color: C.text },
  cardSub: { fontSize: 12, color: C.muted, marginTop: 3 },
  emptyWrap: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, color: C.textSec, marginTop: 12, fontWeight: '600' },
  emptySubText: { fontSize: 14, color: C.muted, marginTop: 4 },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: C.iris, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: C.iris, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalScroll: { flexGrow: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.cardBorder, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: C.text, marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: C.textSec, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: C.cardBorder, borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 16, color: C.text, backgroundColor: C.bg },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.cardBorder, borderRadius: 12, padding: 14, marginBottom: 16, backgroundColor: C.bg, gap: 10 },
  pickerText: { flex: 1, fontSize: 15, color: C.text },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  cancelBtn: { flex: 1, marginRight: 8, padding: 14, borderRadius: 12, backgroundColor: C.bg, alignItems: 'center' },
  cancelTxt: { color: C.textSec, fontWeight: '600' },
  saveBtn: { flex: 1, marginLeft: 8, padding: 14, borderRadius: 12, backgroundColor: C.iris, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  saveTxt: { color: '#FFF', fontWeight: '600' },
});
