import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

const savedPlaces = [
  { name: 'Descanso Gardens', type: 'Nature', note: 'Best for a slow morning' },
  { name: 'The Huntington', type: 'Culture', note: 'Good rainy-day pick' },
  { name: 'Ramen Tatsunoya', type: 'Food', note: 'Great lunch stop' },
];

export default function SavedScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle" style={styles.heading}>Saved</ThemedText>
          <ThemedText themeColor="textSecondary">Places you want to revisit later.</ThemedText>

          {savedPlaces.map((place) => (
            <View key={place.name} style={styles.card}>
              <View style={styles.dot} />
              <View style={styles.cardBody}>
                <ThemedText type="smallBold" style={styles.title}>{place.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{place.type}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{place.note}</ThemedText>
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
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#1d5a4d' },
  cardBody: { flex: 1, gap: 4 },
  title: { color: '#1d5a4d' },
});
