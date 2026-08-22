import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import theme, { fonts } from '../theme';
import { authLogin } from '../services/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Campos requeridos', 'Ingresa tu email y contraseña.');
      return;
    }
    setLoading(true);
    try {
      const data = await authLogin(email.trim(), password);
      await SecureStore.setItemAsync('access_token',  data.access_token);
      await SecureStore.setItemAsync('refresh_token', data.refresh_token);
      await SecureStore.setItemAsync('user_id',       data.user_id);
      navigation.replace('MainTabs');
    } catch (err) {
      Alert.alert('Error al iniciar sesión', err.message || 'Credenciales inválidas.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>nolvi</Text>
          <Text style={styles.tagline}>Tú vives, Nolvi recuerda</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Iniciar sesión</Text>

          {/* Email */}
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={theme.muted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="correo@ejemplo.com"
              placeholderTextColor={theme.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password */}
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={theme.muted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Contraseña"
              placeholderTextColor={theme.muted}
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}>
              <Ionicons name={showPass ? 'eye-outline' : 'eye-off-outline'} size={18} color={theme.muted} />
            </TouchableOpacity>
          </View>

          {/* Botón */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Iniciar sesión</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Link registro */}
        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkWrap}>
          <Text style={styles.linkText}>
            ¿No tienes cuenta?{' '}
            <Text style={styles.linkAccent}>Regístrate</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoText: {
    fontFamily: fonts.bold,
    fontSize: 42,
    color: theme.purple,
    letterSpacing: -1,
  },
  tagline: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: theme.textSec,
    marginTop: 4,
  },
  card: {
    backgroundColor: theme.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 20,
    color: theme.text,
    marginBottom: 20,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    paddingHorizontal: 12,
    marginBottom: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: theme.text,
  },
  eyeBtn: {
    padding: 4,
  },
  btn: {
    backgroundColor: theme.purple,
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: '#fff',
  },
  linkWrap: {
    alignItems: 'center',
    marginTop: 24,
  },
  linkText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: theme.textSec,
  },
  linkAccent: {
    fontFamily: fonts.semibold,
    color: theme.purple,
  },
});
