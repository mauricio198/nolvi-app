import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import C, { fonts } from '../theme';

const NOTE_COLORS = ['#FFF9C4', '#C8E6C9', '#BBDEFB', '#F8BBD9', '#E1BEE7', '#FFE0B2'];

export default function NotesScreen() {
  const [notes, setNotes]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [content, setContent]     = useState('');
  const [saving, setSaving]       = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch]       = useState('');

  const [refreshing, setRefreshing] = useState(false);
  const load = async () => {
    try { const d = await api.getNotes(); setNotes(Array.isArray(d) ? d : []); }
    catch (e) {} finally { setLoading(false); }
  };
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  useFocusEffect(useCallback(() => { load(); }, []));

  const openNew = () => { setContent(''); setEditingId(null); setShowModal(true); };

  const openEdit = (item) => {
    setEditingId(item.id);
    setContent(item.content);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!content.trim()) return Alert.alert('Error', 'Escribe algo primero');
    setSaving(true);
    try {
      if (editingId) {
        await api.updateNote(editingId, { content: content.trim() });
      } else {
        await api.createNote({ content: content.trim() });
      }
      setContent(''); setShowModal(false); setEditingId(null); setExpandedId(null); load();
    } catch (e) { Alert.alert('Error', 'No se pudo guardar'); } finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Eliminar nota', '¿Seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { try { await api.deleteNote(id); setExpandedId(null); load(); } catch (e) {} } },
    ]);
  };

  const filtered = search.trim()
    ? notes.filter(n => n.content.toLowerCase().includes(search.toLowerCase()))
    : notes;

  const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) + ' · ' +
           d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const cardColor = (id) => NOTE_COLORS[Math.abs(id.charCodeAt(0) + id.charCodeAt(1)) % NOTE_COLORS.length];

  const renderItem = ({ item }) => {
    const isExpanded = expandedId === item.id;
    const bg = cardColor(item.id || '0');
    const preview = item.content.length > 120 ? item.content.slice(0, 120) + '…' : item.content;
    return (
      <TouchableOpacity
        style={[st.card, { backgroundColor: bg }, isExpanded && st.cardExpanded]}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        activeOpacity={0.85}
      >
        <Text style={st.cardText}>{isExpanded ? item.content : preview}</Text>
        <View style={st.cardFooter}>
          <Text style={st.cardDate}>{fmtDate(item.created_at)}</Text>
          {isExpanded ? (
            <View style={st.actionBtns}>
              <TouchableOpacity style={st.actionBtn} onPress={() => { setExpandedId(null); openEdit(item); }}>
                <Ionicons name="pencil" size={16} color="#555" />
              </TouchableOpacity>
              <TouchableOpacity style={[st.actionBtn, { marginLeft: 6 }]} onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <Ionicons name="chevron-down" size={14} color="#888" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={st.center}><ActivityIndicator size="large" color={C.yellow || '#F59E0B'} /></View>;

  return (
    <View style={st.container}>
      {/* HEADER */}
      <View style={st.header}>
        <View style={st.headerRow}>
          <Ionicons name="journal" size={24} color="#FFF" />
          <Text style={st.headerTitle}>Notas</Text>
        </View>
        <Text style={st.headerCount}>{notes.length} nota{notes.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* BÚSQUEDA */}
      <View style={st.searchWrap}>
        <Ionicons name="search-outline" size={16} color={C.muted} style={{ marginRight: 8 }} />
        <TextInput
          style={st.searchInput}
          placeholder="Buscar en mis notas..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={C.muted}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={C.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* LISTA */}
      <FlatList
        data={filtered}
        keyExtractor={(it, i) => it.id?.toString() || i.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AMBER} colors={[AMBER]} />}
        ListEmptyComponent={
          <View style={st.emptyWrap}>
            <Ionicons name="journal-outline" size={48} color={C.muted} />
            <Text style={st.emptyText}>{search ? 'Sin resultados' : 'Sin notas'}</Text>
            <Text style={st.emptySubText}>{search ? 'Prueba con otra búsqueda' : 'Toca + para escribir algo'}</Text>
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
          <View style={st.modalContent}>
            <View style={st.modalHandle} />
            <Text style={st.modalTitle}>{editingId ? 'Editar nota' : 'Nueva nota'}</Text>
            <TextInput
              style={st.textarea}
              placeholder="Escribe aquí..."
              value={content}
              onChangeText={setContent}
              placeholderTextColor={C.muted}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              autoFocus
            />
            <View style={st.modalBtns}>
              <TouchableOpacity style={st.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={st.cancelTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.saveBtn} onPress={handleSave} disabled={saving}>
                <Ionicons name="checkmark" size={18} color="#FFF" />
                <Text style={st.saveTxt}>{saving ? 'Guardando...' : ' Guardar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const AMBER = '#F59E0B';

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

  header: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: AMBER, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 22, fontFamily: fonts.bold, color: '#FFF' },
  headerCount: { fontSize: 14, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.7)' },

  searchWrap: { flexDirection: 'row', alignItems: 'center', margin: 16, marginBottom: 4, backgroundColor: C.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: C.cardBorder },
  searchInput: { flex: 1, fontSize: 14, fontFamily: fonts.regular, color: C.text },

  card: { borderRadius: 14, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  cardExpanded: { borderWidth: 1.5, borderColor: AMBER },
  cardText: { fontSize: 15, fontFamily: fonts.regular, color: '#333', lineHeight: 22 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  cardDate: { fontSize: 11, fontFamily: fonts.regular, color: '#888' },
  actionBtns: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.6)', justifyContent: 'center', alignItems: 'center' },

  emptyWrap: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, color: C.textSec, marginTop: 12, fontFamily: fonts.semibold },
  emptySubText: { fontSize: 14, color: C.muted, marginTop: 4, fontFamily: fonts.regular },

  fab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: AMBER, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: AMBER, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.cardBorder, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontFamily: fonts.bold, color: C.text, marginBottom: 16 },
  textarea: { borderWidth: 1, borderColor: C.cardBorder, borderRadius: 12, padding: 14, fontSize: 15, minHeight: 140, marginBottom: 16, color: C.text, backgroundColor: C.bg, fontFamily: fonts.regular },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelBtn: { flex: 1, marginRight: 8, padding: 14, borderRadius: 12, backgroundColor: C.bg, alignItems: 'center' },
  cancelTxt: { color: C.textSec, fontFamily: fonts.semibold },
  saveBtn:   { flex: 1, marginLeft: 8, padding: 14, borderRadius: 12, backgroundColor: AMBER, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  saveTxt:   { color: '#FFF', fontFamily: fonts.semibold },
});
