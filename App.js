import React, { useState, useCallback, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useFonts, Poppins_300Light, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMyProfile, updateMyProfile } from './src/services/api';
import { registerForPushNotifications } from './src/services/notifications';

import SplashScreen    from './src/screens/SplashScreen';
import LoginScreen     from './src/screens/LoginScreen';
import RegisterScreen  from './src/screens/RegisterScreen';
import HomeScreen      from './src/screens/HomeScreen';
import RemindersScreen from './src/screens/RemindersScreen';
import TasksScreen     from './src/screens/TasksScreen';
import ExpensesScreen  from './src/screens/ExpensesScreen';
import ProfileScreen   from './src/screens/ProfileScreen';
import BirthdaysScreen from './src/screens/BirthdaysScreen';
import NotesScreen     from './src/screens/NotesScreen';
import HabitsScreen    from './src/screens/HabitsScreen';
import CalendarScreen  from './src/screens/CalendarScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TABS = {
  Inicio:        { icon: 'home',            iconOut: 'home-outline' },
  Recordatorios: { icon: 'notifications',   iconOut: 'notifications-outline' },
  Tareas:        { icon: 'checkmark-circle', iconOut: 'checkmark-circle-outline' },
  Gastos:        { icon: 'wallet',           iconOut: 'wallet-outline' },
  Notas:         { icon: 'journal',          iconOut: 'journal-outline' },
  Perfil:        { icon: 'person',           iconOut: 'person-outline' },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#7C6AF7',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarIcon: ({ focused, color }) => {
          const cfg = TABS[route.name];
          return <Ionicons name={focused ? cfg.icon : cfg.iconOut} size={22} color={color} />;
        },
        tabBarStyle: {
          height: 85, paddingBottom: 25, paddingTop: 8,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1, borderTopColor: '#EAEAF2',
          shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06, shadowRadius: 12, elevation: 12,
        },
        tabBarLabelStyle: { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Recordatorios" component={RemindersScreen} />
      <Tab.Screen name="Tareas" component={TasksScreen} />
      <Tab.Screen name="Gastos" component={ExpensesScreen} />
      <Tab.Screen name="Notas"  component={NotesScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [showSplash, setShowSplash]     = useState(true);
  const [authChecking, setAuthChecking] = useState(false);
  const [isLoggedIn, setIsLoggedIn]     = useState(null); // null = aún no sabemos
  const [fontsLoaded] = useFonts({ Poppins_300Light, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold });

  // Se ejecuta cuando el splash termina: verifica si hay sesión guardada.
  const handleSplashFinish = useCallback(async () => {
    setShowSplash(false);
    setAuthChecking(true);
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        try {
          const profile = await getMyProfile();
          if (profile?.name) {
            await AsyncStorage.setItem('nolvi_user_name', profile.name);
          }
          const pushToken = await registerForPushNotifications();
          if (pushToken && pushToken !== profile?.expo_push_token) {
            updateMyProfile({ expo_push_token: pushToken }).catch(() => {});
          }
        } catch (err) {
          // perfil no disponible, continuar sin nombre
        }
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch {
      setIsLoggedIn(false);
    } finally {
      setAuthChecking(false);
    }
  }, []);

  // Cargando fuentes
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#090D20' }}>
        <ActivityIndicator size="large" color="#7C6AF7" />
      </View>
    );
  }

  // Splash animado de bienvenida
  if (showSplash) {
    return (
      <>
        <StatusBar style="light" />
        <SplashScreen onFinish={handleSplashFinish} />
      </>
    );
  }

  // Verificando token en SecureStore
  if (authChecking || isLoggedIn === null) {
    return (
      <View style={styles.authLoader}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#7C5CBF" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isLoggedIn ? (
            // Usuario con sesión activa → va directo a la app
            <>
              <Stack.Screen name="MainTabs"   component={MainTabs} />
              <Stack.Screen name="Cumpleaños" component={BirthdaysScreen} options={{ presentation: 'card' }} />
              <Stack.Screen name="Hábitos"    component={HabitsScreen}    options={{ presentation: 'card' }} />
              <Stack.Screen name="Calendario" component={CalendarScreen}   options={{ presentation: 'card' }} />
            </>
          ) : (
            // Sin sesión → pantallas públicas de auth
            <>
              <Stack.Screen name="Login"    component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              {/* Incluidas para que login pueda hacer replace a MainTabs */}
              <Stack.Screen name="MainTabs"   component={MainTabs} />
              <Stack.Screen name="Cumpleaños" component={BirthdaysScreen} options={{ presentation: 'card' }} />
              <Stack.Screen name="Hábitos"    component={HabitsScreen}    options={{ presentation: 'card' }} />
              <Stack.Screen name="Calendario" component={CalendarScreen}   options={{ presentation: 'card' }} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  authLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
