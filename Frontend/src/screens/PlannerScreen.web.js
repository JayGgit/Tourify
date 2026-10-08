import React from 'react';
import { Text, StyleSheet } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';

export default function PlannerScreen() {
  return (
    <ScreenContainer contentStyle={styles.content}>
      <Text style={styles.title}>Day Planner</Text>
      <Text style={styles.message}>Add places from For You or Saved to build your itinerary.</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center' },
  title: { fontSize: 30, fontWeight: '800', color: '#152033', marginBottom: 12 },
  message: { fontSize: 16, color: '#64748B', lineHeight: 24 },
});
