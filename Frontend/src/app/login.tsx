import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createUser, getCurrentUser, loginUser } from '@/lib/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const user = await getCurrentUser();
      if (user) {
        router.replace('/');
      }
    };

    checkUser();
  }, [router]);

  const handleSubmit = async () => {
    setMessage('');

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (mode === 'signup' && !cleanName) {
      setMessage('Please enter your full name.');
      return;
    }

    if (!cleanEmail || !cleanPassword) {
      setMessage('Please enter both your email and password.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(cleanEmail)) {
      setMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        const user = await createUser({ name: cleanName, email: cleanEmail, password: cleanPassword });
        if (!user) {
          setMessage('That email is already in use or the details are invalid.');
          return;
        }

        router.replace('/');
        return;
      }

      const user = await loginUser(cleanEmail, cleanPassword);
      if (!user) {
        setMessage('Incorrect email or password.');
        return;
      }

      if (!rememberMe) {
        setMessage('This device will not stay signed in.');
      }

      router.replace('/');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoGlyph}>T</Text>
          </View>
          <Text style={styles.logo}>TOURIFY</Text>
          <Text style={styles.subtitle}>PLAN A DAY THAT FEELS LIKE YOU.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleButton, mode === 'login' && styles.toggleButtonActive]}
              onPress={() => setMode('login')}>
              <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>LOG IN</Text>
            </Pressable>
            <Pressable
              style={[styles.toggleButton, mode === 'signup' && styles.toggleButtonActive]}
              onPress={() => setMode('signup')}>
              <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>SIGN UP</Text>
            </Pressable>
          </View>

          {mode === 'signup' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>FULL NAME</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="JORDAN LEE"
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="YOU@EXAMPLE.COM"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
              />
              <Pressable style={styles.visibilityButton} onPress={() => setShowPassword((value) => !value)}>
                <Text style={styles.visibilityText}>{showPassword ? 'HIDE' : 'SHOW'}</Text>
              </Pressable>
            </View>
          </View>

          {mode === 'login' && (
            <View style={styles.metaRow}>
              <Pressable style={styles.checkboxRow} onPress={() => setRememberMe((value) => !value)}>
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe ? <Text style={styles.checkmark}>✓</Text> : null}
                </View>
                <Text style={styles.metaText}>REMEMBER ME</Text>
              </Pressable>

              <Pressable>
                <Text style={styles.linkText}>FORGOT?</Text>
              </Pressable>
            </View>
          )}

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <Pressable style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={isSubmitting}>
            <Text style={styles.submitText}>{isSubmitting ? 'PLEASE WAIT...' : mode === 'signup' ? 'CREATE ACCOUNT' : 'LOG IN'}</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <Pressable style={styles.socialButton}>
              <Text style={styles.socialText}>CONTINUE WITH GOOGLE</Text>
            </Pressable>
            <Pressable style={styles.socialButton}>
              <Text style={styles.socialText}>CONTINUE WITH APPLE</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f1e8' },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 20,
  },
  header: { gap: 12, alignItems: 'flex-start' },
  logoBadge: {
    width: 64,
    height: 64,
    backgroundColor: '#f7ff3d',
    borderWidth: 3,
    borderColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  logoGlyph: { fontSize: 30, fontWeight: '900', color: '#111111' },
  logo: { fontSize: 42, fontWeight: '900', letterSpacing: 2, color: '#111111' },
  subtitle: { fontSize: 14, color: '#111111', fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 4,
    borderColor: '#111111',
    padding: 20,
    gap: 18,
    shadowColor: '#111111',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#f7ff3d',
    borderWidth: 3,
    borderColor: '#111111',
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 3,
    borderColor: 'transparent',
    alignItems: 'center',
    backgroundColor: '#f5f1e8',
  },
  toggleButtonActive: { backgroundColor: '#111111' },
  toggleText: { color: '#111111', fontWeight: '800', letterSpacing: 1 },
  toggleTextActive: { color: '#f7ff3d' },
  fieldGroup: { gap: 8 },
  label: { color: '#111111', fontWeight: '900', letterSpacing: 1.2 },
  input: {
    borderWidth: 3,
    borderColor: '#111111',
    backgroundColor: '#fefefe',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#111111',
    fontWeight: '700',
  },
  passwordWrap: {
    borderWidth: 3,
    borderColor: '#111111',
    backgroundColor: '#fefefe',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#111111',
    fontWeight: '700',
  },
  visibilityButton: { paddingVertical: 8, paddingHorizontal: 4 },
  visibilityText: { color: '#111111', fontWeight: '900', letterSpacing: 1 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 3,
    borderColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7ff3d',
  },
  checkboxChecked: { backgroundColor: '#111111' },
  checkmark: { color: '#f7ff3d', fontSize: 12, fontWeight: '900' },
  metaText: { color: '#111111', fontWeight: '700', letterSpacing: 1 },
  linkText: { color: '#111111', fontWeight: '900', letterSpacing: 1 },
  message: {
    color: '#111111',
    fontWeight: '800',
    backgroundColor: '#ff6b4a',
    borderWidth: 3,
    borderColor: '#111111',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  submitButton: {
    backgroundColor: '#111111',
    borderWidth: 3,
    borderColor: '#111111',
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.75 },
  submitText: { color: '#f7ff3d', fontWeight: '900', letterSpacing: 1.3 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: { flex: 1, height: 3, backgroundColor: '#111111' },
  dividerText: { color: '#111111', fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
  socialRow: { gap: 10 },
  socialButton: {
    backgroundColor: '#f5f1e8',
    borderWidth: 3,
    borderColor: '#111111',
    paddingVertical: 12,
    alignItems: 'center',
  },
  socialText: { color: '#111111', fontWeight: '800', letterSpacing: 1 },
});
