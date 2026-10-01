import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { API_URL } from '../config';

WebBrowser.maybeCompleteAuthSession();

const { height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenHeight < 700;

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

export default function LoginScreen({ onLogin }) {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nonce] = useState(() => (
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  ));

  const googleConfigured = Boolean(GOOGLE_CLIENT_ID);

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'tourify',
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      responseType: 'id_token',
      usePKCE: false,
      prompt: 'select_account',
      extraParams: {
        nonce,
      },
    },
    discovery
  );

  useEffect(() => {
    if (!response) return;

    if (response.type === 'success') {
      const idToken = response.params?.id_token;

      if (!idToken) {
        setError('Google did not return an ID token.');
        setIsSubmitting(false);
        return;
      }

      handleGoogleSuccess(idToken);
    }

    if (response.type === 'error') {
      setError(
        response.error?.message || 'Google sign in failed.'
      );
      setIsSubmitting(false);
    }

    if (response.type === 'cancel' || response.type === 'dismiss') {
      setIsSubmitting(false);
    }
  }, [response]);

  const handleGoogleSignIn = async () => {
    if (!googleConfigured) {
      setError('Google sign in is not configured yet.');
      return;
    }

    if (!request) {
      setError('Google sign in is still loading. Try again.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await promptAsync();
    } catch (e) {
      setError('Failed to start Google sign in.');
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (idToken) => {
    try {
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || 'Google authentication failed.'
        );
      }

      onLogin(result.email);
    } catch (requestError) {
      setError(
        requestError.message === 'Failed to fetch'
          ? `Cannot reach the auth server at ${API_URL}. Start the backend and try again.`
          : requestError.message || 'Unable to sign in with Google. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer
      style={styles.screen}
      contentStyle={styles.content}
      keyboardAware
    >
      <View style={styles.brandMark}>
        <Text style={styles.brandMarkText}>T</Text>
      </View>

      <Text style={styles.eyebrow}>Welcome to Tourify</Text>

      <Text style={styles.title}>Plan trips that feel like you.</Text>

      <Text style={styles.subtitle}>
        Sign in with Google to save places and build your personalized itinerary.
      </Text>

      <View style={styles.form}>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.googleButton, isSubmitting && styles.disabledButton]}
          onPress={handleGoogleSignIn}
          disabled={isSubmitting}
        >
          <View style={styles.googleButtonContent}>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleButtonText}>
              {isSubmitting
                ? 'Signing in...'
                : 'Continue with Google'}
            </Text>
          </View>
        </Pressable>

        {!googleConfigured && (
          <Text style={styles.unavailableText}>
            Add EXPO_PUBLIC_GOOGLE_CLIENT_ID to Frontend/.env.local, then restart Expo.
          </Text>
        )}

      </View>

      <Text style={styles.helper}>
        Your Google account email is stored securely on the Tourify server.
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F4F7FB',
  },

  content: {
    flex: 1,
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
    marginBottom: isSmallScreen ? 16 : 24,
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
    marginBottom: isSmallScreen ? 6 : 10,
  },

  title: {
    fontSize: isSmallScreen ? 28 : 36,
    lineHeight: isSmallScreen ? 34 : 42,
    fontWeight: '800',
    color: '#152033',
    marginBottom: isSmallScreen ? 8 : 12,
  },

  subtitle: {
    fontSize: isSmallScreen ? 14 : 16,
    lineHeight: isSmallScreen ? 20 : 24,
    color: '#64748B',
    marginBottom: isSmallScreen ? 20 : 32,
  },

  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: isSmallScreen ? 16 : 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },

  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  googleIcon: {
    fontSize: 20,
    color: '#4285F4',
    fontWeight: '700',
  },

  googleButtonText: {
    color: '#152033',
    fontSize: 16,
    fontWeight: '700',
  },

  unavailableText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },

  error: {
    color: '#B91C1C',
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
  },

  disabledButton: {
    opacity: 0.55,
  },

  helper: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },
});
