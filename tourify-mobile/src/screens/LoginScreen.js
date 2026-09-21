import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { API_URL } from '../config';

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`${API_URL}/${mode === 'register' ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
        signal: controller.signal,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Unable to authenticate.');
      }

      onLogin(result.email);
    } catch (requestError) {
      setError(requestError.name === 'AbortError'
        ? 'The auth server did not respond. Start npm run server and try again.'
        : requestError.message || 'Unable to reach the server.');
    } finally {
      clearTimeout(timeout);
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer style={styles.screen} contentStyle={styles.content} keyboardAware>
      <View style={styles.brandMark}>
        <Text style={styles.brandMarkText}>T</Text>
      </View>
      <Text style={styles.eyebrow}>{mode === 'register' ? 'Create your account' : 'Welcome to Tourify'}</Text>
      <Text style={styles.title}>{mode === 'register' ? 'Start planning your way.' : 'Plan trips that feel like you.'}</Text>
      <Text style={styles.subtitle}>
        {mode === 'register'
          ? 'Create an account to save places and build your personalized itinerary.'
          : 'Sign in to save places and build your personalized itinerary.'}
      </Text>

      <View style={styles.form}>
        <Text style={styles.label}>Email address</Text>
        <TextInput
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            if (error) setError('');
          }}
          placeholder="you@example.com"
          placeholderTextColor="#94A3B8"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          style={[styles.input, error && styles.inputError]}
          onSubmitEditing={handleSubmit}
          returnKeyType="continue"
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (error) setError('');
          }}
          placeholder="At least 8 characters"
          placeholderTextColor="#94A3B8"
          secureTextEntry
          autoCapitalize="none"
          style={[styles.input, error && styles.inputError]}
          onSubmitEditing={handleSubmit}
          returnKeyType={mode === 'register' ? 'next' : 'done'}
        />
        {mode === 'register' ? (
          <>
            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your password"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              autoCapitalize="none"
              style={[styles.input, error && styles.inputError]}
              onSubmitEditing={handleSubmit}
              returnKeyType="done"
            />
          </>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>{isSubmitting ? 'Connecting...' : mode === 'register' ? 'Create account' : 'Log in'}</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.modeButton}
        onPress={() => {
          setMode(mode === 'login' ? 'register' : 'login');
          setError('');
        }}
      >
        <Text style={styles.modeText}>
          {mode === 'login' ? 'Need an account? Create one' : 'Already have an account? Log in'}
        </Text>
      </Pressable>
      <Text style={styles.helper}>Passwords are stored as secure hashes on the local server.</Text>
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
  label: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#152033',
    fontSize: 16,
    marginBottom: 10,
  },
  inputError: {
    borderColor: '#DC2626',
  },
  error: {
    color: '#B91C1C',
    fontSize: 13,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#4C6FFF',
    borderRadius: 12,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modeButton: {
    alignItems: 'center',
    marginTop: 18,
  },
  modeText: {
    color: '#3557D8',
    fontSize: 14,
    fontWeight: '700',
  },
  helper: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },
});