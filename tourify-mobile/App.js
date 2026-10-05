import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { Ionicons } from '@expo/vector-icons';
import ProfileScreen from './src/screens/ProfileScreen';
import ForYouScreen from './src/screens/ForYouScreen';
import SavedScreen from './src/screens/SavedScreen';
import PlannerScreen from './src/screens/PlannerScreen';
import { SavedPlacesProvider } from './src/context/SavedPlacesContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInEmail, setLoggedInEmail] = useState('');

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    NavigationBar.setPositionAsync('absolute');
    NavigationBar.setBackgroundColorAsync('transparent');
    NavigationBar.setButtonStyleAsync('dark');
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SavedPlacesProvider>
            {isLoggedIn ? (
              <AppNavigator email={loggedInEmail} />
            ) : (
              <LoginScreen onLogin={(email) => {
                setLoggedInEmail(email);
                setIsLoggedIn(true);
              }} />
            )}
          </SavedPlacesProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppNavigator({ email }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Profile"
        screenOptions={({ route }) => ({
            animation: 'shift',
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;

                if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
                else if (route.name === 'For You') iconName = focused ? 'sparkles' : 'sparkles-outline';
                else if (route.name === 'Saved') iconName = focused ? 'bookmark' : 'bookmark-outline';
                else if (route.name === 'Planner') iconName = focused ? 'calendar' : 'calendar-outline';

                return <Ionicons name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: '#4C6FFF',
              tabBarInactiveTintColor: '#7B8794',
              headerShown: false,
              tabBarStyle: {
                backgroundColor: theme.surface,
                borderTopColor: theme.border,
                height: 62 + insets.bottom,
                paddingBottom: insets.bottom + 6,
                paddingTop: 10,
              },
        })}
      >
        <Tab.Screen name="Profile" component={ProfileScreen} initialParams={{ email }} />
        <Tab.Screen name="For You" component={ForYouScreen} />
        <Tab.Screen name="Saved" component={SavedScreen} />
        <Tab.Screen name="Planner" component={PlannerScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
