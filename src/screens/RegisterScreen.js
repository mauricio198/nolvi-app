import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme, { fonts } from '../theme';
import { authRegister } from '../services/api';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading]   = useState(false);

  async function handleRegister() {
    if (!email.trim() || !password || !confirm) {
      Alert.alert('Campos requeridos', 'Completa todos los campos.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Las contraseñas no coinciden', 'Verifica que ambas contraseñas sean iguales.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña muy corta', 'Usa al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const data = await authRegister(email.trim(), password);

      // Supabase puede pedir verificación de email (devuelve token vacío)
      if (!data.access_token) {
        Alert.alert(
          '¡Casi listo!',
          'Revisa tu correo y confirma tu cuenta para continuar.',
          [{ text: 'Ir al login', onPress: () => navigation.navigate('Login') }],
        );
        return;
      }

      Alert.alert(
        '¡Cuenta creada!',
        'Tu cuenta fue creada exitosamente.',
        [{ text: 'Iniciar sesión', onPress: () => navigation.navigate('Login') }],
      );
    } catch (err) {
      Alert.alert('Error al registrarse', err.message || 'Inténtalo de nuevo.');
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
          <Text style={styles.title}>Crear cuenta</Text>

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
              placeholder="Contraseña (mín. 6 caracteres)"
              placeholderTextColor={theme.muted}
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}>
              <Ionicons name={showPass ? 'eye-outline' : 'eye-off-outline'} size={18} color={theme.muted} />
            </TouchableOpacity>
          </View>

          {/* Confirmar password */}
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={theme.muted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Confirmar contraseña"
              placeholderTextColor={theme.muted}
              secureTextEntry={!showConf}
              value={confirm}
              onChangeText={setConfirm}
            />
            <TouchableOpacity onPress={() => setShowConf(v => !v)} style={styles.eyeBtn}>
              <Ionicons name={showConf ? 'eye-outline' : 'eye-off-outline'} size={18} color={theme.muted} />
            </TouchableOpacity>
          </View>

          {/* Botón */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Crear cuenta</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Link login */}
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkWrap}>
          <Text style={styles.linkText}>
            ¿Ya tienes cuenta?{' '}
            <Text style={styles.linkAccent}>Inicia sesión</Text>
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
