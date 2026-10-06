import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Dimensions } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { API_URL } from '../config';

const { height } = Dimensions.get('window');

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to authenticate.');
      onLogin(result.email);
    } catch (requestError) {
      setError(requestError.message === 'Failed to fetch'
        ? `Cannot reach the server at ${API_URL}. Make sure your phone and computer use the same Wi-Fi.`
        : requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer style={styles.screen} contentStyle={styles.content} keyboardAware>
      <View style={styles.brandMark}><Text style={styles.brandText}>T</Text></View>
      <Text style={styles.eyebrow}>{mode === 'register' ? 'Create your account' : 'Welcome to Tourify'}</Text>
      <Text style={styles.title}>Plan trips that feel like you.</Text>
      <Text style={styles.subtitle}>Sign in with your email to save places and build your itinerary.</Text>
      <View style={styles.form}>
        <Text style={styles.label}>Email address</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={[styles.button, isSubmitting && styles.disabled]} onPress={handleSubmit} disabled={isSubmitting}>
          <Text style={styles.buttonText}>
            {isSubmitting ? 'Connecting...' : mode === 'register' ? 'Create account' : 'Log in'}
          </Text>
        </Pressable>
      </View>
      <Pressable onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
        <Text style={styles.modeText}>
          {mode === 'login' ? 'Need an account? Create one' : 'Already have an account? Log in'}
        </Text>
      </Pressable>
      <Text style={styles.helper}>Your account is stored securely on the Tourify server.</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F4F7FB' },
  content: { flex: 1, justifyContent: 'center', paddingBottom: 24 },
  brandMark: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#4C6FFF', alignItems: 'center', justifyContent: 'center', marginBottom: height < 700 ? 16 : 24 },
  brandText: { color: '#FFF', fontSize: 30, fontWeight: '800' },
  eyebrow: { fontSize: 13, color: '#4C6FFF', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '700', marginBottom: 10 },
  title: { fontSize: height < 700 ? 28 : 36, lineHeight: height < 700 ? 34 : 42, fontWeight: '800', color: '#152033', marginBottom: 12 },
  subtitle: { fontSize: 16, lineHeight: 24, color: '#64748B', marginBottom: 28 },
  form: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 18 },
  label: { color: '#334155', fontWeight: '700', marginBottom: 7, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 13, fontSize: 16, color: '#152033' },
  error: { color: '#B42318', marginTop: 12, lineHeight: 20 },
  button: { backgroundColor: '#4C6FFF', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 18 },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  modeText: { color: '#4C6FFF', textAlign: 'center', fontWeight: '700' },
  helper: { color: '#64748B', textAlign: 'center', marginTop: 24 },
});
