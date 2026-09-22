import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

const plan = [
  { time: '9:30 AM', title: 'Coffee stop', detail: 'Start the morning with a smooth breakfast.' },
  { time: '11:00 AM', title: 'Garden walk', detail: 'Relax outdoors and take photos.' },
  { time: '1:30 PM', title: 'Lunch', detail: 'Close the loop with a casual bite.' },
];

export default function PlannerScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle" style={styles.heading}>Day Planner</ThemedText>
          <ThemedText themeColor="textSecondary">Build an easy itinerary from your saved favorites.</ThemedText>

          {plan.map((item) => (
            <View key={item.time} style={styles.card}>
              <ThemedText type="smallBold" style={styles.time}>{item.time}</ThemedText>
              <View style={styles.cardBody}>
                <ThemedText type="smallBold" style={styles.title}>{item.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{item.detail}</ThemedText>
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4efe7' },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: BottomTabInset + Spacing.three,
  },
  content: { padding: Spacing.four, gap: Spacing.three },
  heading: { color: '#1d5a4d', fontSize: 28, lineHeight: 34 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  time: { color: '#ca6b48' },
  title: { color: '#1d5a4d' },
  cardBody: { gap: 4 },
});
