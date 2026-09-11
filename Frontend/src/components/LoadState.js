import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function LoadingState() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color="#4C6FFF" />
      <Text style={[styles.message, { color: theme.mutedText }]}>Finding places for you...</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Something went wrong</Text>
      <Text style={[styles.message, { color: theme.mutedText }]}>{message}</Text>
      <Pressable style={styles.button} onPress={onRetry}>
        <Text style={styles.buttonText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  button: { backgroundColor: '#4C6FFF', borderRadius: 11, paddingHorizontal: 20, paddingVertical: 12, marginTop: 18 },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
});
