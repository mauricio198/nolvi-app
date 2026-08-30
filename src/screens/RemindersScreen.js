import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, ScrollView, Keyboard, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from '../components/DateTimePickerModal';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { scheduleLocalNotification } from '../services/notifications';
import C, { fonts } from '../theme';

export default function RemindersScreen() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [pickerDate, setPickerDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const [refreshing, setRefreshing] = useState(false);
  const load = async () => { try { const d = await api.getReminders(); setReminders(Array.isArray(d) ? d : []); } catch (e) {} finally { setLoading(false); } };
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  useFocusEffect(useCallback(() => { load(); }, []));

  const openModal = () => { setTitle(''); setPickerDate(new Date()); setEditingId(null); setShowModal(true); };

  const openEdit = (item) => {
    setEditingId(item.id);
    setTitle(item.title || item.message || '');
    setPickerDate(item.remind_at ? new Date(item.remind_at) : new Date());
    setShowModal(true);
  };

  const fmtDate = (d) => d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const fmtTime = (d) => d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });

  const handleSave = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Escribe un recordatorio');
    if (!editingId && pickerDate <= new Date()) return Alert.alert('Error', 'La fecha debe ser en el futuro');
    setSaving(true);
    try {
      if (editingId) {
        await api.updateReminder(editingId, { title: title.trim(), remind_at: pickerDate.toISOString() });
      } else {
        const newReminder = await api.createReminder({ title: title.trim(), remind_at: pickerDate.toISOString() });
        try { await scheduleLocalNotification(newReminder); } catch (_) {}
      }
      setShowModal(false);
      setEditingId(null);
      setExpandedId(null);
      load();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Eliminar', '¿Seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { try { await api.deleteReminder(id); setExpandedId(null); load(); } catch (e) {} } },
    ]);
  };

  const renderItem = ({ item }) => {
    const isExpanded = expandedId === item.id;
    return (
      <TouchableOpacity style={[st.card, isExpanded && st.cardExpanded]} onPress={() => setExpandedId(isExpanded ? null : item.id)} activeOpacity={0.85}>
        <View style={st.iconCircle}><Ionicons name="notifications" size={20} color={C.purple} /></View>
        <View style={{ flex: 1 }}>
          <Text style={st.cardText}>{item.title || item.message}</Text>
          <Text style={st.cardSub}>{item.remind_at ? new Date(item.remind_at).toLocaleString('es-CO') : 'Sin fecha'}</Text>
        </View>
        {isExpanded ? (
          <View style={st.actionBtns}>
            <TouchableOpacity style={st.actionBtn} onPress={() => { setExpandedId(null); openEdit(item); }}>
              <Ionicons name="pencil" size={18} color={C.purple} />
            </TouchableOpacity>
            <TouchableOpacity style={[st.actionBtn, { marginLeft: 6 }]} onPress={() => handleDelete(item.id)}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={16} color={C.muted} />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={st.center}><ActivityIndicator size="large" color={C.purple} /></View>;

  return (
    <View style={st.container}>
      <View style={st.header}><View style={st.headerRow}><Ionicons name="notifications" size={24} color="#FFF" /><Text style={st.headerTitle}>Recordatorios</Text></View><Text style={st.headerCount}>{reminders.length} total</Text></View>
      <FlatList data={reminders} keyExtractor={(it, i) => it.id?.toString() || i.toString()} renderItem={renderItem} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.purple} colors={[C.purple]} />}
        ListEmptyComponent={<View style={st.emptyWrap}><Ionicons name="notifications-off-outline" size={48} color={C.muted} /><Text style={st.emptyText}>Sin recordatorios</Text><Text style={st.emptySubText}>Toca + para crear uno</Text></View>} />
      <TouchableOpacity style={st.fab} onPress={openModal}><Ionicons name="add" size={30} color="#FFF" /></TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={st.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowModal(false)} />
          <ScrollView contentContainerStyle={st.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={st.modalContent}>
              <DateTimePickerModal
                visible={showPicker}
                value={pickerDate}
                mode="datetime"
                onConfirm={(date) => { setPickerDate(date); setShowPicker(false); }}
                onCancel={() => setShowPicker(false)}
                minimumDate={new Date()}
              />
              <View style={st.modalHandle} />
              <Text style={st.modalTitle}>{editingId ? 'Editar recordatorio' : 'Nuevo recordatorio'}</Text>
              <Text style={st.inputLabel}>¿Qué quieres recordar?</Text>
              <TextInput style={st.input} placeholder="Ej: Pagar internet" value={title} onChangeText={setTitle} placeholderTextColor={C.muted} />
              <Text style={st.inputLabel}>Fecha y hora</Text>
              <TouchableOpacity style={st.pickerBtn} onPress={() => { Keyboard.dismiss(); setShowPicker(true); }}>
                <Ionicons name="calendar-outline" size={20} color={C.purple} />
                <Text style={st.pickerText}>{fmtDate(pickerDate)}  {fmtTime(pickerDate)}</Text>
                <Ionicons name="chevron-down" size={16} color={C.muted} />
              </TouchableOpacity>
              <View style={st.modalBtns}>
                <TouchableOpacity style={st.cancelBtn} onPress={() => setShowModal(false)}><Text style={st.cancelTxt}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity style={st.saveBtn} onPress={handleSave} disabled={saving}><Ionicons name="checkmark" size={18} color="#FFF" /><Text style={st.saveTxt}>{saving ? 'Guardando...' : ' Guardar'}</Text></TouchableOpacity>
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
  cardExpanded: { borderWidth: 1.5, borderColor: C.purple },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.purpleLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardText: { fontSize: 15, fontFamily: fonts.semibold, color: C.text }, cardSub: { fontSize: 12, fontFamily: fonts.regular, color: C.muted, marginTop: 3 },
  actionBtns: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { alignItems: 'center', marginTop: 80 }, emptyText: { fontSize: 18, color: C.textSec, marginTop: 12, fontFamily: fonts.semibold }, emptySubText: { fontSize: 14, color: C.muted, marginTop: 4, fontFamily: fonts.regular },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: C.purple, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: C.purple, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }, modalScroll: { flexGrow: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.cardBorder, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontFamily: fonts.bold, color: C.text, marginBottom: 20 },
  inputLabel: { fontSize: 13, fontFamily: fonts.semibold, color: C.textSec, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: C.cardBorder, borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 16, color: C.text, backgroundColor: C.bg, fontFamily: fonts.regular },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.cardBorder, borderRadius: 12, padding: 14, marginBottom: 16, backgroundColor: C.bg, gap: 10 },
  pickerText: { flex: 1, fontSize: 15, color: C.text, fontFamily: fonts.regular },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  cancelBtn: { flex: 1, marginRight: 8, padding: 14, borderRadius: 12, backgroundColor: C.bg, alignItems: 'center' }, cancelTxt: { color: C.textSec, fontFamily: fonts.semibold },
  saveBtn: { flex: 1, marginLeft: 8, padding: 14, borderRadius: 12, backgroundColor: C.purple, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }, saveTxt: { color: '#FFF', fontFamily: fonts.semibold },
});
