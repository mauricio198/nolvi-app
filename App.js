import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import RemindersScreen from './src/screens/RemindersScreen';
import TasksScreen from './src/screens/TasksScreen';
import ExpensesScreen from './src/screens/ExpensesScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TABS = {
  Inicio: { icon: 'home', iconOut: 'home-outline' },
  Recordatorios: { icon: 'notifications', iconOut: 'notifications-outline' },
  Tareas: { icon: 'checkmark-circle', iconOut: 'checkmark-circle-outline' },
  Gastos: { icon: 'wallet', iconOut: 'wallet-outline' },
  Perfil: { icon: 'person', iconOut: 'person-outline' },
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return (
      <>
        <StatusBar style="light" />
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarShowLabel: true,
            tabBarActiveTintColor: '#7C6AF6',
            tabBarInactiveTintColor: '#A0A5BD',
            tabBarIcon: ({ focused, color }) => {
              const cfg = TABS[route.name];
              return <Ionicons name={focused ? cfg.icon : cfg.iconOut} size={22} color={color} />;
            },
            tabBarStyle: {
              height: 85,
              paddingBottom: 25,
              paddingTop: 8,
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#EEEEF2',
              elevation: 0,
            },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          })}
        >
          <Tab.Screen name="Inicio" component={HomeScreen} />
          <Tab.Screen name="Recordatorios" component={RemindersScreen} />
          <Tab.Screen name="Tareas" component={TasksScreen} />
          <Tab.Screen name="Gastos" component={ExpensesScreen} />
          <Tab.Screen name="Perfil" component={ProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}
