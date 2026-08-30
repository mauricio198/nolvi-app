import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, Modal, KeyboardAvoidingView, Platform, Switch, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { getMyProfile, updateMyProfile } from '../services/api';
import C, { fonts } from '../theme';

// Cuando tengas el número dedicado de Nolvi, ponlo aquí (formato: 57300XXXXXXX sin + ni espacios)
const NOLVI_WHATSAPP_NUMBER = null;

const HELP_TEXT = `¿Necesitas ayuda con Nolvi?

Escríbenos y te respondemos lo antes posible.

Preguntas frecuentes:
• ¿Cómo creo un recordatorio? Toca el botón + en la pantalla de Recordatorios.
• ¿Nolvi funciona por WhatsApp? Sí, muy pronto podrás escribirle directamente.
• ¿Mis datos están seguros? Sí, se almacenan de forma segura y nunca se comparten con terceros.`;

const PRIVACY_TEXT = `Privacidad — Nolvi

Tus datos (recordatorios, tareas, gastos) se guardan de forma segura y solo tú puedes acceder a ellos.

No vendemos ni compartimos tu información con terceros.

Puedes solicitar la eliminación de tus datos en cualquier momento desde esta sección.`;

const TERMS_TEXT = `Términos y condiciones — Nolvi

Al usar Nolvi aceptas que es una herramienta de apoyo para organizar tu vida personal y tu negocio.

Nolvi no se hace responsable por pérdidas derivadas de recordatorios no entregados por fallas de conexión o del dispositivo.

El uso de Nolvi es bajo tu propia responsabilidad.`;

const MENU_CONFIG = [
  { key: 'notif', icon: 'notifications-outline', label: 'Notificaciones', color: C.purple, type: 'toggle' },
  { key: 'premium', icon: 'diamond-outline', label: 'Plan Premium', color: '#FFD93D', type: 'soon' },
  { key: 'whatsapp', icon: 'logo-whatsapp', label: 'Conectar WhatsApp', color: '#25D366', type: 'whatsapp' },
  { key: 'appearance', icon: 'color-palette-outline', label: 'Apariencia', color: C.coral, type: 'soon' },
];
const MENU_SUPPORT = [
  { key: 'help', icon: 'help-circle-outline', label: 'Ayuda', color: C.purple, type: 'info', text: HELP_TEXT, title: 'Ayuda' },
  { key: 'privacy', icon: 'shield-checkmark-outline', label: 'Privacidad', color: C.green, type: 'info', text: PRIVACY_TEXT, title: 'Privacidad' },
  { key: 'terms', icon: 'document-text-outline', label: 'Términos y condiciones', color: C.textSec, type: 'info', text: TERMS_TEXT, title: 'Términos y condiciones' },
];

export default function ProfileScreen() {
  const [stats, setStats] = useState({ reminders: 0, tasks: 0, tasksDone: 0, expenses: 0, birthdays: 0 });
  const [name, setName] = useState('Usuario Nolvi');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempPhone, setTempPhone] = useState('');
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [infoModal, setInfoModal] = useState(null);

  useEffect(() => {
    (async () => {
      const sn = await AsyncStorage.getItem('nolvi_user_name');
      const sp = await AsyncStorage.getItem('nolvi_user_photo');
      const sNotif = await AsyncStorage.getItem('nolvi_notif_enabled');
      if (sn) setName(sn); if (sp) setPhoto(sp);
      if (sNotif !== null) setNotifEnabled(sNotif === 'true');
      try {
        const profile = await getMyProfile();
        if (profile?.name) { setName(profile.name); await AsyncStorage.setItem('nolvi_user_name', profile.name); }
        if (profile?.phone && profile.phone !== 'sin-telefono') setPhone(profile.phone);
      } catch (_) {}
    })();
  }, []);

  const load = async () => {
    try {
      const [r, t, e, b] = await Promise.all([api.getReminders().catch(() => []), api.getTasks().catch(() => []), api.getExpenses().catch(() => []), api.getBirthdays().catch(() => [])]);
      const tl = Array.isArray(t) ? t : [];
      setStats({ reminders: Array.isArray(r) ? r.length : 0, tasks: tl.length, tasksDone: tl.filter(x => x.is_completed).length, expenses: Array.isArray(e) ? e.reduce((s, x) => s + (x.amount || 0), 0) : 0, birthdays: Array.isArray(b) ? b.length : 0 });
    } catch (e) {}
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled && result.assets[0]) { setPhoto(result.assets[0].uri); await AsyncStorage.setItem('nolvi_user_photo', result.assets[0].uri); }
  };
  const saveName = async () => {
    if (!tempName.trim()) return;
    setName(tempName.trim());
    await AsyncStorage.setItem('nolvi_user_name', tempName.trim());
    updateMyProfile({ name: tempName.trim() }).catch(() => {});
    setShowNameModal(false);
  };

  const savePhone = async () => {
    if (!tempPhone.trim()) return;
    setPhone(tempPhone.trim());
    try { await updateMyProfile({ phone: tempPhone.trim() }); }
    catch (_) { Alert.alert('Error', 'No se pudo guardar el teléfono'); return; }
    setShowPhoneModal(false);
  };
  const getInitials = (n) => { const p = n.split(' '); return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : n.substring(0, 2).toUpperCase(); };

  const toggleNotif = async (val) => {
    setNotifEnabled(val);
    await AsyncStorage.setItem('nolvi_notif_enabled', val.toString());
  };

  const handleWhatsApp = () => {
    if (!NOLVI_WHATSAPP_NUMBER) {
      Alert.alert('Próximamente', 'Aún no tenemos un número dedicado de Nolvi en WhatsApp. Muy pronto podrás escribirle directamente 💜');
      return;
    }
    const url = `https://wa.me/${NOLVI_WHATSAPP_NUMBER}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'No se pudo abrir WhatsApp'));
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres cerrar sesión? Se borrará tu nombre y foto de este dispositivo.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión', style: 'destructive', onPress: async () => {
          await AsyncStorage.multiRemove(['nolvi_user_name', 'nolvi_user_photo']);
          await SecureStore.deleteItemAsync('access_token');
          await SecureStore.deleteItemAsync('refresh_token');
          await SecureStore.deleteItemAsync('user_id');
          setName('Usuario Nolvi'); setPhoto(null);
          Alert.alert('Listo', 'Sesión cerrada en este dispositivo');
        },
      },
    ]);
  };

  const handleMenuPress = (item) => {
    if (item.type === 'soon') Alert.alert('Próximamente', `${item.label} estará disponible pronto 💜`);
    else if (item.type === 'whatsapp') handleWhatsApp();
    else if (item.type === 'info') setInfoModal(item);
  };

  return (
    <ScrollView style={st.container}>
      <View style={st.header}>
        <TouchableOpacity style={st.avatarWrap} onPress={pickImage}>
          {photo ? <Image source={{ uri: photo }} style={st.avatarImg} /> : <View style={st.avatarPlaceholder}><Text style={st.avatarText}>{getInitials(name)}</Text></View>}
          <View style={st.editBadge}><Ionicons name="camera" size={14} color="#FFF" /></View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { setTempName(name); setShowNameModal(true); }}>
          <View style={st.nameRow}><Text style={st.name}>{name}</Text><Ionicons name="pencil" size={14} color="rgba(255,255,255,0.7)" /></View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { setTempPhone(phone); setShowPhoneModal(true); }}>
          <View style={st.phoneRow}>
            <Ionicons name="call-outline" size={13} color="rgba(255,255,255,0.7)" />
            <Text style={st.phoneText}>{phone || 'Agregar teléfono'}</Text>
            <Ionicons name="pencil" size={12} color="rgba(255,255,255,0.5)" />
          </View>
        </TouchableOpacity>
        <View style={st.badge}><Ionicons name="sparkles" size={12} color={C.purple} /><Text style={st.badgeText}> Plan Gratis</Text></View>
      </View>

      <View style={st.statsGrid}>
        {[
          { num: stats.reminders, lbl: 'Recordatorios', icon: 'notifications-outline', color: C.purple, bg: C.purpleLight },
          { num: `${stats.tasksDone}/${stats.tasks}`, lbl: 'Tareas', icon: 'checkmark-circle-outline', color: C.green, bg: C.greenLight },
          { num: `$${stats.expenses.toLocaleString()}`, lbl: 'Total gastos', icon: 'wallet-outline', color: C.coral, bg: C.coralLight },
          { num: stats.birthdays, lbl: 'Cumpleaños', icon: 'gift-outline', color: C.blue, bg: C.blueLight },
        ].map((s, i) => (
          <View key={i} style={st.statBox}><View style={[st.statIcon, { backgroundColor: s.bg }]}><Ionicons name={s.icon} size={20} color={s.color} /></View>
            <Text style={[st.statNum, { color: s.color }]}>{s.num}</Text><Text style={st.statLbl}>{s.lbl}</Text></View>
        ))}
      </View>

      <View style={st.section}>
        <Text style={st.sectionTitle}>CONFIGURACIÓN</Text>
        {MENU_CONFIG.map((item) => (
          <TouchableOpacity key={item.key} style={st.menuItem} onPress={() => item.type !== 'toggle' && handleMenuPress(item)} activeOpacity={item.type === 'toggle' ? 1 : 0.6}>
            <View style={st.menuLeft}>
              <View style={[st.menuIcon, { backgroundColor: item.color + '15' }]}><Ionicons name={item.icon} size={20} color={item.color} /></View>
              <Text style={st.menuText}>{item.label}</Text>
            </View>
            {item.type === 'toggle' ? (
              <Switch value={notifEnabled} onValueChange={toggleNotif} trackColor={{ false: C.cardBorder, true: C.purple }} thumbColor="#FFF" />
            ) : (
              <Ionicons name="chevron-forward" size={18} color={C.muted} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={st.section}>
        <Text style={st.sectionTitle}>SOPORTE</Text>
        {MENU_SUPPORT.map((item) => (
          <TouchableOpacity key={item.key} style={st.menuItem} onPress={() => handleMenuPress(item)}>
            <View style={st.menuLeft}>
              <View style={[st.menuIcon, { backgroundColor: item.color + '15' }]}><Ionicons name={item.icon} size={20} color={item.color} /></View>
              <Text style={st.menuText}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.muted} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={st.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={C.danger} /><Text style={st.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
      <Text style={st.version}>Nolvi v1.0.0</Text><View style={{ height: 40 }} />

      {/* Modal editar nombre */}
      <Modal visible={showNameModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={st.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowNameModal(false)} />
          <View style={st.modalContent}><View style={st.modalHandle} /><Text style={st.modalTitle}>Editar nombre</Text>
            <TextInput style={st.input} placeholder="Tu nombre" value={tempName} onChangeText={setTempName} placeholderTextColor={C.muted} autoFocus />
            <View style={st.modalBtns}><TouchableOpacity style={st.cancelBtn} onPress={() => setShowNameModal(false)}><Text style={st.cancelTxt}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={st.saveBtn} onPress={saveName}><Ionicons name="checkmark" size={18} color="#FFF" /><Text style={st.saveTxt}> Guardar</Text></TouchableOpacity></View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal editar teléfono */}
      <Modal visible={showPhoneModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={st.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowPhoneModal(false)} />
          <View style={st.modalContent}><View style={st.modalHandle} /><Text style={st.modalTitle}>Editar teléfono</Text>
            <TextInput style={st.input} placeholder="Ej: +57 300 000 0000" value={tempPhone} onChangeText={setTempPhone} placeholderTextColor={C.muted} keyboardType="phone-pad" autoFocus />
            <View style={st.modalBtns}><TouchableOpacity style={st.cancelBtn} onPress={() => setShowPhoneModal(false)}><Text style={st.cancelTxt}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={st.saveBtn} onPress={savePhone}><Ionicons name="checkmark" size={18} color="#FFF" /><Text style={st.saveTxt}> Guardar</Text></TouchableOpacity></View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal info (ayuda, privacidad, términos) */}
      <Modal visible={!!infoModal} animationType="slide" transparent>
        <View style={st.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setInfoModal(null)} />
          <View style={st.modalContent}>
            <View style={st.modalHandle} />
            <View style={st.infoHeader}>
              <Text style={st.modalTitle}>{infoModal?.title}</Text>
              <TouchableOpacity onPress={() => setInfoModal(null)}><Ionicons name="close" size={24} color={C.muted} /></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={st.infoText}>{infoModal?.text}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingTop: 60, paddingBottom: 28, alignItems: 'center', backgroundColor: C.purple, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatarImg: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  avatarText: { fontSize: 32, fontFamily: fonts.bold, color: '#FFF' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: C.coral, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: C.purple },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 }, name: { fontSize: 22, fontFamily: fonts.bold, color: '#FFF' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  phoneText: { fontSize: 13, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.75)' },
  badge: { marginTop: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12, backgroundColor: '#FFF' },
  badgeText: { fontSize: 12, color: C.purple, fontFamily: fonts.semibold },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, marginTop: 8 },
  statBox: { width: '48%', margin: '1%', backgroundColor: C.white, borderRadius: 14, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  statIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  statNum: { fontSize: 20, fontFamily: fonts.bold }, statLbl: { fontSize: 12, color: C.muted, marginTop: 2, fontFamily: fonts.regular },
  section: { marginTop: 20, marginHorizontal: 16 }, sectionTitle: { fontSize: 12, fontFamily: fonts.semibold, color: C.muted, marginBottom: 8, letterSpacing: 1 },
  menuItem: { backgroundColor: C.white, padding: 14, borderRadius: 12, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuText: { fontSize: 15, color: C.text, fontFamily: fonts.medium },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, marginHorizontal: 16, padding: 14, borderRadius: 12, backgroundColor: '#FFF0F0' },
  logoutText: { fontSize: 15, color: C.danger, fontFamily: fonts.semibold },
  version: { textAlign: 'center', color: C.muted, marginTop: 20, fontSize: 13, fontFamily: fonts.regular },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.cardBorder, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontFamily: fonts.bold, color: C.text, marginBottom: 20 },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: -10 },
  infoText: { fontSize: 14, fontFamily: fonts.regular, color: C.textSec, lineHeight: 22 },
  input: { borderWidth: 1, borderColor: C.cardBorder, borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 16, color: C.text, backgroundColor: C.bg, fontFamily: fonts.regular },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  cancelBtn: { flex: 1, marginRight: 8, padding: 14, borderRadius: 12, backgroundColor: C.bg, alignItems: 'center' }, cancelTxt: { color: C.textSec, fontFamily: fonts.semibold },
  saveBtn: { flex: 1, marginLeft: 8, padding: 14, borderRadius: 12, backgroundColor: C.purple, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }, saveTxt: { color: '#FFF', fontFamily: fonts.semibold },
});
