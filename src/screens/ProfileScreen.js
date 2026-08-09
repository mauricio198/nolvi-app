import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Image, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import C from '../theme';

const MENU_CONFIG = [
  { icon: 'notifications-outline', label: 'Notificaciones', color: C.iris },
  { icon: 'diamond-outline', label: 'Plan Premium', color: '#FFD93D' },
  { icon: 'logo-whatsapp', label: 'Conectar WhatsApp', color: '#25D366' },
  { icon: 'color-palette-outline', label: 'Apariencia', color: C.peach },
];
const MENU_SUPPORT = [
  { icon: 'help-circle-outline', label: 'Ayuda', color: C.iris },
  { icon: 'shield-checkmark-outline', label: 'Privacidad', color: '#2ECC71' },
  { icon: 'document-text-outline', label: 'Términos y condiciones', color: C.textSec },
];

export default function ProfileScreen() {
  const [stats, setStats] = useState({ reminders: 0, tasks: 0, tasksDone: 0, expenses: 0, birthdays: 0 });
  const [name, setName] = useState('Usuario Nolvi');
  const [photo, setPhoto] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState('');

  // Cargar nombre y foto guardados
  useEffect(() => {
    (async () => {
      const savedName = await AsyncStorage.getItem('nolvi_user_name');
      const savedPhoto = await AsyncStorage.getItem('nolvi_user_photo');
      if (savedName) setName(savedName);
      if (savedPhoto) setPhoto(savedPhoto);
    })();
  }, []);

  const load = async () => {
    try {
      const [r, t, e, b] = await Promise.all([
        api.getReminders().catch(() => []),
        api.getTasks().catch(() => []),
        api.getExpenses().catch(() => []),
        api.getBirthdays().catch(() => []),
      ]);
      const taskList = Array.isArray(t) ? t : [];
      setStats({
        reminders: Array.isArray(r) ? r.length : 0,
        tasks: taskList.length,
        tasksDone: taskList.filter(x => x.is_completed).length,
        expenses: Array.isArray(e) ? e.reduce((s, x) => s + (x.amount || 0), 0) : 0,
        birthdays: Array.isArray(b) ? b.length : 0,
      });
    } catch (e) { console.log(e); }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería para elegir una foto');
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhoto(uri);
      await AsyncStorage.setItem('nolvi_user_photo', uri);
    }
  };

  const saveName = async () => {
    if (!tempName.trim()) return;
    setName(tempName.trim());
    await AsyncStorage.setItem('nolvi_user_name', tempName.trim());
    setShowNameModal(false);
  };

  const getInitials = (n) => {
    const parts = n.split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : n.substring(0, 2).toUpperCase();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {/* Foto de perfil */}
        <TouchableOpacity style={styles.avatarWrap} onPress={pickImage}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{getInitials(name)}</Text>
            </View>
          )}
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={14} color="#FFF" />
          </View>
        </TouchableOpacity>

        {/* Nombre editable */}
        <TouchableOpacity onPress={() => { setTempName(name); setShowNameModal(true); }}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{name}</Text>
            <Ionicons name="pencil" size={14} color="rgba(255,255,255,0.7)" />
          </View>
        </TouchableOpacity>

        <View style={styles.badge}>
          <Ionicons name="sparkles" size={12} color={C.iris} />
          <Text style={styles.badgeText}> Plan Gratis</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        {[
          { num: stats.reminders, lbl: 'Recordatorios', icon: 'notifications-outline', color: C.iris, bg: C.irisLight },
          { num: `${stats.tasksDone}/${stats.tasks}`, lbl: 'Tareas', icon: 'checkmark-circle-outline', color: '#2ECC71', bg: C.mintLight },
          { num: `$${stats.expenses.toLocaleString()}`, lbl: 'Total gastos', icon: 'wallet-outline', color: C.peach, bg: C.peachLight },
          { num: stats.birthdays, lbl: 'Cumpleaños', icon: 'gift-outline', color: C.iris, bg: C.irisLight },
        ].map((s, i) => (
          <View key={i} style={styles.statBox}>
            <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
              <Ionicons name={s.icon} size={20} color={s.color} />
            </View>
            <Text style={[styles.statNum, { color: s.color }]}>{s.num}</Text>
            <Text style={styles.statLbl}>{s.lbl}</Text>
          </View>
        ))}
      </View>

      {/* Configuración */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CONFIGURACIÓN</Text>
        {MENU_CONFIG.map((item, i) => (
          <TouchableOpacity key={i} style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.menuText}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.muted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Soporte */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SOPORTE</Text>
        {MENU_SUPPORT.map((item, i) => (
          <TouchableOpacity key={i} style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.menuText}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.muted} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn}>
        <Ionicons name="log-out-outline" size={20} color={C.danger} />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Nolvi v1.0.0</Text>
      <View style={{ height: 40 }} />

      {/* Modal editar nombre */}
      <Modal visible={showNameModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowNameModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Editar nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Tu nombre"
              value={tempName}
              onChangeText={setTempName}
              placeholderTextColor={C.muted}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowNameModal(false)}>
                <Text style={styles.cancelTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveName}>
                <Ionicons name="checkmark" size={18} color="#FFF" />
                <Text style={styles.saveTxt}> Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingTop: 60, paddingBottom: 28, alignItems: 'center', backgroundColor: C.iris, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatarImg: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: C.peach, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: C.iris },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  badge: { marginTop: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12, backgroundColor: '#FFF' },
  badgeText: { fontSize: 12, color: C.iris, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, marginTop: 8 },
  statBox: { width: '48%', margin: '1%', backgroundColor: C.white, borderRadius: 14, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  statIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  statNum: { fontSize: 20, fontWeight: 'bold' },
  statLbl: { fontSize: 12, color: C.muted, marginTop: 2 },
  section: { marginTop: 20, marginHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: C.muted, marginBottom: 8, letterSpacing: 1 },
  menuItem: { backgroundColor: C.white, padding: 14, borderRadius: 12, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuText: { fontSize: 15, color: C.text, fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, marginHorizontal: 16, padding: 14, borderRadius: 12, backgroundColor: '#FFF0F0' },
  logoutText: { fontSize: 15, color: C.danger, fontWeight: '600' },
  version: { textAlign: 'center', color: C.muted, marginTop: 20, fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.cardBorder, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: C.text, marginBottom: 20 },
  input: { borderWidth: 1, borderColor: C.cardBorder, borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 16, color: C.text, backgroundColor: C.bg },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  cancelBtn: { flex: 1, marginRight: 8, padding: 14, borderRadius: 12, backgroundColor: C.bg, alignItems: 'center' },
  cancelTxt: { color: C.textSec, fontWeight: '600' },
  saveBtn: { flex: 1, marginLeft: 8, padding: 14, borderRadius: 12, backgroundColor: C.iris, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  saveTxt: { color: '#FFF', fontWeight: '600' },
});
