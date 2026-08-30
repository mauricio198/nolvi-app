import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import C, { fonts } from '../theme';

const ICONS = [
  'barbell-outline', 'water-outline', 'book-outline', 'nutrition-outline',
  'walk-outline', 'sunny-outline', 'bed-outline', 'musical-notes-outline',
  'leaf-outline', 'fitness-outline', 'medal-outline', 'bicycle-outline',
  'pencil-outline', 'code-slash-outline', 'heart-outline', 'checkmark-circle-outline',
];

const COLORS = [
  '#7C6AF7', '#F97455', '#2EC4B6', '#5B8CF7',
  '#FFB347', '#FF6B9D', '#16A34A', '#F59E0B',
];

const getStreak = (logs) => {
  if (!logs || logs.length === 0) return 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const logSet = new Set(logs.map(l => new Date(l).toDateString()));
  let streak = 0;
  let d = new Date(today);
  if (!logSet.has(d.toDateString())) d.setDate(d.getDate() - 1);
  while (logSet.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
};

const isLoggedToday = (logs) => {
  const today = new Date().toDateString();
  return (logs || []).some(l => new Date(l).toDateString() === today);
};

export default function HabitsScreen() {
  const [habits, setHabits]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName]           = useState('');
  const [icon, setIcon]           = useState('checkmark-circle-outline');
  const [color, setColor]         = useState('#7C6AF7');
  const [saving, setSaving]       = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [toggling, setToggling]   = useState(null); // id siendo toggleado

  const load = async () => {
    try { const d = await api.getHabits(); setHabits(Array.isArray(d) ? d : []); }
    catch (e) {} finally { setLoading(false); }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const openNew = () => { setName(''); setIcon('checkmark-circle-outline'); setColor('#7C6AF7'); setEditingId(null); setShowModal(true); };

  const openEdit = (item) => {
    setEditingId(item.id); setName(item.name); setIcon(item.icon); setColor(item.color);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Escribe el nombre del hábito');
    setSaving(true);
    try {
      if (editingId) {
        await api.updateHabit(editingId, { name: name.trim(), icon, color });
      } else {
        await api.createHabit({ name: name.trim(), icon, color });
      }
      setShowModal(false); setEditingId(null); setExpandedId(null); load();
    } catch (e) { Alert.alert('Error', 'No se pudo guardar'); } finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Eliminar hábito', '¿Seguro? Se borrarán todos los registros.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { try { await api.deleteHabit(id); setExpandedId(null); load(); } catch (e) {} } },
    ]);
  };

  const handleToggle = async (item) => {
    if (toggling) return;
    setToggling(item.id);
    const done = isLoggedToday(item.logs);
    try {
      if (done) {
        await api.unlogHabit(item.id);
      } else {
        await api.logHabit(item.id);
      }
      await load();
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar');
    } finally {
      setToggling(null);
    }
  };

  const doneToday = habits.filter(h => isLoggedToday(h.logs)).length;

  const renderItem = ({ item }) => {
    const done    = isLoggedToday(item.logs);
    const streak  = getStreak(item.logs);
    const isExpanded = expandedId === item.id;

    return (
      <TouchableOpacity
        style={[st.card, done && st.cardDone, isExpanded && { borderWidth: 1.5, borderColor: item.color }]}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        activeOpacity={0.85}
      >
        {/* Checkbox */}
        <TouchableOpacity
          onPress={() => handleToggle(item)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          disabled={toggling === item.id}
          style={{ marginRight: 12 }}
        >
          <View style={[st.checkCircle, done && { backgroundColor: item.color, borderColor: item.color }]}>
            {(done || toggling === item.id)
              ? <Ionicons name={toggling === item.id ? 'ellipsis-horizontal' : 'checkmark'} size={16} color="#FFF" />
              : null}
          </View>
        </TouchableOpacity>

        {/* Ícono */}
        <View style={[st.iconCircle, { backgroundColor: item.color + '20' }]}>
          <Ionicons name={item.icon} size={20} color={item.color} />
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={[st.cardName, done && { textDecorationLine: 'line-through', color: C.muted }]}>{item.name}</Text>
          {streak > 0
            ? <Text style={[st.streakText, { color: item.color }]}>🔥 {streak} día{streak !== 1 ? 's' : ''} seguidos</Text>
            : <Text style={st.streakZero}>Sin racha aún</Text>
          }
        </View>

        {/* Acciones o chevron */}
        {isExpanded ? (
          <View style={st.actionBtns}>
            <TouchableOpacity style={st.actionBtn} onPress={() => { setExpandedId(null); openEdit(item); }}>
              <Ionicons name="pencil" size={16} color={item.color} />
            </TouchableOpacity>
            <TouchableOpacity style={[st.actionBtn, { marginLeft: 6 }]} onPress={() => handleDelete(item.id)}>
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={16} color={C.muted} />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={st.center}><ActivityIndicator size="large" color="#7C6AF7" /></View>;

  return (
    <View style={st.container}>
      {/* HEADER */}
      <View style={st.header}>
        <View>
          <View style={st.headerRow}><Ionicons name="ribbon" size={24} color="#FFF" /><Text style={st.headerTitle}>Hábitos</Text></View>
          <Text style={st.headerCount}>{habits.length} hábito{habits.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={st.headerTotalLabel}>Hoy</Text>
          <Text style={st.headerTotal}>{doneToday}/{habits.length}</Text>
        </View>
      </View>

      {/* PROGRESO DEL DÍA */}
      {habits.length > 0 && (
        <View style={st.progressWrap}>
          <View style={st.progressBar}>
            <View style={[st.progressFill, { width: `${habits.length ? (doneToday / habits.length) * 100 : 0}%` }]} />
          </View>
          <Text style={st.progressLabel}>
            {doneToday === habits.length && habits.length > 0
              ? '¡Completaste todos tus hábitos hoy! 🎉'
              : `${doneToday} de ${habits.length} completados`}
          </Text>
        </View>
      )}

      {/* LISTA */}
      <FlatList
        data={habits}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={st.emptyWrap}>
            <Ionicons name="ribbon-outline" size={52} color={C.muted} />
            <Text style={st.emptyText}>Sin hábitos</Text>
            <Text style={st.emptySubText}>Toca + para crear el primero</Text>
          </View>
        }
      />

      <TouchableOpacity style={st.fab} onPress={openNew}>
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>

      {/* MODAL */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={st.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowModal(false)} />
          <ScrollView contentContainerStyle={st.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={st.modalContent}>
              <View style={st.modalHandle} />
              <Text style={st.modalTitle}>{editingId ? 'Editar hábito' : 'Nuevo hábito'}</Text>

              <Text style={st.inputLabel}>Nombre</Text>
              <TextInput style={st.input} placeholder="Ej: Tomar agua" value={name} onChangeText={setName} placeholderTextColor={C.muted} autoFocus />

              <Text style={st.inputLabel}>Color</Text>
              <View style={st.colorRow}>
                {COLORS.map(c => (
                  <TouchableOpacity key={c} style={[st.colorDot, { backgroundColor: c }, color === c && st.colorDotActive]} onPress={() => setColor(c)}>
                    {color === c && <Ionicons name="checkmark" size={14} color="#FFF" />}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={st.inputLabel}>Ícono</Text>
              <View style={st.iconGrid}>
                {ICONS.map(ic => (
                  <TouchableOpacity
                    key={ic}
                    style={[st.iconOption, icon === ic && { backgroundColor: color, borderColor: color }]}
                    onPress={() => setIcon(ic)}
                  >
                    <Ionicons name={ic} size={22} color={icon === ic ? '#FFF' : C.textSec} />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Preview */}
              <View style={[st.preview, { borderColor: color + '60' }]}>
                <View style={[st.previewIcon, { backgroundColor: color + '20' }]}>
                  <Ionicons name={icon} size={22} color={color} />
                </View>
                <Text style={st.previewName}>{name || 'Nombre del hábito'}</Text>
              </View>

              <View style={st.modalBtns}>
                <TouchableOpacity style={st.cancelBtn} onPress={() => setShowModal(false)}><Text style={st.cancelTxt}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity style={[st.saveBtn, { backgroundColor: color }]} onPress={handleSave} disabled={saving}>
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

  header: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: '#7C6AF7', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 22, fontFamily: fonts.bold, color: '#FFF' },
  headerCount: { fontSize: 12, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerTotalLabel: { fontSize: 11, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.7)' },
  headerTotal: { fontSize: 26, fontFamily: fonts.bold, color: '#FFF' },

  progressWrap: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
  progressBar:  { height: 6, backgroundColor: C.cardBorder, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: 6, backgroundColor: '#7C6AF7', borderRadius: 3 },
  progressLabel:{ fontSize: 12, fontFamily: fonts.medium, color: C.textSec, textAlign: 'center' },

  card: { backgroundColor: C.white, borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  cardDone: { opacity: 0.75 },
  checkCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#D0D0E0', justifyContent: 'center', alignItems: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardName:   { fontSize: 15, fontFamily: fonts.semibold, color: C.text },
  streakText: { fontSize: 12, fontFamily: fonts.medium, marginTop: 2 },
  streakZero: { fontSize: 11, fontFamily: fonts.regular, color: C.muted, marginTop: 2 },
  actionBtns: { flexDirection: 'row', alignItems: 'center' },
  actionBtn:  { width: 34, height: 34, borderRadius: 17, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },

  emptyWrap: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, color: C.textSec, marginTop: 12, fontFamily: fonts.semibold },
  emptySubText: { fontSize: 14, color: C.muted, marginTop: 4, fontFamily: fonts.regular },

  fab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#7C6AF7', justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#7C6AF7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalScroll:  { flexGrow: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: C.cardBorder, alignSelf: 'center', marginBottom: 16 },
  modalTitle:   { fontSize: 20, fontFamily: fonts.bold, color: C.text, marginBottom: 20 },
  inputLabel:   { fontSize: 13, fontFamily: fonts.semibold, color: C.textSec, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: C.cardBorder, borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 16, color: C.text, backgroundColor: C.bg, fontFamily: fonts.regular },

  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  colorDot: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  colorDotActive: { borderWidth: 3, borderColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },

  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  iconOption: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.cardBorder },

  preview: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1.5, marginBottom: 20, backgroundColor: C.bg },
  previewIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  previewName: { fontSize: 15, fontFamily: fonts.semibold, color: C.text, flex: 1 },

  modalBtns: { flexDirection: 'row' },
  cancelBtn: { flex: 1, marginRight: 8, padding: 14, borderRadius: 12, backgroundColor: C.bg, alignItems: 'center' },
  cancelTxt: { color: C.textSec, fontFamily: fonts.semibold },
  saveBtn:   { flex: 1, marginLeft: 8, padding: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  saveTxt:   { color: '#FFF', fontFamily: fonts.semibold },
});
