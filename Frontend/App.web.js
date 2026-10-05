import React, { useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ProfileScreen from './src/screens/ProfileScreen';
import ForYouScreen from './src/screens/ForYouScreen.web';
import SavedScreen from './src/screens/SavedScreen';
import PlannerScreen from './src/screens/PlannerScreen.web';
import { SavedPlacesProvider } from './src/context/SavedPlacesContext';
import { PlannerProvider } from './src/context/PlannerContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { ProfileProvider } from './src/context/ProfileContext';
import LoginScreen from './src/screens/LoginScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInEmail, setLoggedInEmail] = useState('');

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SavedPlacesProvider>
          <PlannerProvider>
            {isLoggedIn ? (
              <ProfileProvider email={loggedInEmail}>
                <NavigationContainer>
                  <Tab.Navigator
                    screenOptions={({ route }) => ({
                      headerShown: false,
                      tabBarActiveTintColor: '#4C6FFF',
                      tabBarIcon: ({ focused, color, size }) => {
                        const names = {
                          Profile: focused ? 'person' : 'person-outline',
                          'For You': focused ? 'sparkles' : 'sparkles-outline',
                          Saved: focused ? 'bookmark' : 'bookmark-outline',
                          Planner: focused ? 'calendar' : 'calendar-outline',
                        };
                        return <Ionicons name={names[route.name]} size={size} color={color} />;
                      },
                    })}
                  >
                    <Tab.Screen name="Profile" component={ProfileScreen} initialParams={{ email: loggedInEmail }} />
                    <Tab.Screen name="For You" component={ForYouScreen} />
                    <Tab.Screen name="Saved" component={SavedScreen} />
                    <Tab.Screen name="Planner" component={PlannerScreen} />
                  </Tab.Navigator>
                </NavigationContainer>
              </ProfileProvider>
            ) : (
              <LoginScreen onLogin={(email) => {
                setLoggedInEmail(email);
                setIsLoggedIn(true);
              }} />
            )}
          </PlannerProvider>
        </SavedPlacesProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
