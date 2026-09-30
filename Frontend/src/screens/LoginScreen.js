import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Alert } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import * as AppleAuthentication from 'expo-apple-authentication';
import { API_URL } from '../config';

export default function LoginScreen({ onLogin }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);

  useEffect(() => {
    checkAppleAuthAvailability();
  }, []);

  const checkAppleAuthAvailability = async () => {
    try {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      setAppleAuthAvailable(isAvailable);
    } catch (e) {
        // For testing in Expo Go, assume available
        // Remove this in production!
        setAppleAuthAvailable(true);
      }
    };

  const handleAppleSignIn = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Apple Sign In', 'Apple Sign In is only available on iOS devices.');
      return;
    }

    if (!appleAuthAvailable) {
      Alert.alert('Not Available', 'Apple Sign In is not available on this device.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Send the Apple identity token to your backend for verification
      const response = await fetch(`${API_URL}/auth/apple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identityToken: credential.identityToken,
          authorizationCode: credential.authorizationCode,
          fullName: credential.fullName,
          email: credential.email,
          user: credential.user,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Apple authentication failed.');
      }

      onLogin(result.email || credential.email || `apple_${credential.user}`);
    } catch (requestError) {
      if (requestError.code === 'ERR_CANCELED') {
        // User cancelled the sign in flow
        return;
      }
      setError(requestError.message || 'Unable to sign in with Apple. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer style={styles.screen} contentStyle={styles.content} keyboardAware>
      <View style={styles.brandMark}>
        <Text style={styles.brandMarkText}>T</Text>
      </View>
      <Text style={styles.eyebrow}>Welcome to Tourify</Text>
      <Text style={styles.title}>Plan trips that feel like you.</Text>
      <Text style={styles.subtitle}>
        Sign in to save places and build your personalized itinerary.
      </Text>

      <View style={styles.form}>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {appleAuthAvailable ? (
          <Pressable style={styles.appleButton} onPress={handleAppleSignIn} disabled={isLoading}>
            <View style={styles.appleButtonContent}>
              <Text style={styles.appleIcon}></Text>
              <Text style={styles.appleButtonText}>
                {isLoading ? 'Signing in...' : 'Continue with Apple'}
              </Text>
            </View>
          </Pressable>
        ) : (
          <View style={styles.unavailableContainer}>
            <Text style={styles.unavailableText}>
              {Platform.OS != 'ios'
                ? 'Apple Sign In is not available on this device.'
                : 'Apple Sign In is only available on iOS devices.'}
            </Text>
            <Text style={styles.unavailableHint}>
              Please use an iOS device to sign in with Apple.
            </Text>
                    {__DEV__ && Platform.OS === 'ios' && (
                      <Pressable style={[styles.appleButton, styles.testButton]} onPress={handleAppleSignIn} disabled={isLoading}>
                        <View style={styles.appleButtonContent}>
                          <Text style={styles.appleIcon}></Text>
                          <Text style={styles.appleButtonText}>
                            {isLoading ? 'Signing in...' : 'Test Apple Sign In (Dev)'}
                          </Text>
                        </View>
                      </Pressable>
                    )}
                  </View>
                )}
      </View>

      <Text style={styles.helper}>
        Your data is securely stored and never shared.
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F4F7FB',
  },
  content: {
    justifyContent: 'center',
    paddingTop: 0,
    paddingBottom: 24,
  },
  brandMark: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#4C6FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  brandMarkText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },
  eyebrow: {
    fontSize: 13,
    color: '#4C6FFF',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
    marginBottom: 10,
  },
  title: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '800',
    color: '#152033',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#64748B',
    marginBottom: 32,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  appleButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
    testButton: {
      backgroundColor: '#4C6FFF',
      marginTop: 12,
    },
  appleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appleIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  unavailableContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  unavailableText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  unavailableHint: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
  },
  error: {
    color: '#B91C1C',
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
  },
  helper: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },
});