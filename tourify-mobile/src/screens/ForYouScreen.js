import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Dimensions } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { useSavedPlaces } from '../context/SavedPlacesContext';
import { useTheme } from '../context/ThemeContext';
import { ErrorState, LoadingState } from '../components/LoadState';
import { getRecommendedPlaces } from '../services/placesApi';

const { height } = Dimensions.get('window');
const cardHeight = height * 0.68;

export default function ForYouScreen() {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const { isSaved, savePlace } = useSavedPlaces();
  const { theme } = useTheme();

  const loadPlaces = async () => {
    setStatus('loading');
    setError('');

    try {
      setData(await getRecommendedPlaces());
      setStatus('success');
    } catch (loadError) {
      setError(loadError.message);
      setStatus('error');
    }
  };

  useEffect(() => {
    loadPlaces();
  }, []);

  if (status === 'loading') return <LoadingState />;
  if (status === 'error') return <ErrorState message={error} onRetry={loadPlaces} />;

  const renderItem = ({ item }) => (
    <View style={[styles.placeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.image, { backgroundColor: item.color }]} />
      <View style={[styles.content, { backgroundColor: theme.surface }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
          <Text style={[styles.rating, { color: theme.mutedText, backgroundColor: theme.elevatedSurface }]}>⭐ {item.rating}</Text>
        </View>

        <Text style={[styles.meta, { color: theme.mutedText }]}>{item.category} • {item.distance}</Text>
        <Text style={[styles.meta, { color: theme.mutedText }]}>{item.reviews}</Text>

        <View style={styles.chipsRow}>
          {item.tags.map((tag) => (
            <View key={tag} style={[styles.chip, { backgroundColor: theme.elevatedSurface }]}>
              <Text style={[styles.chipText, { color: theme.text }]}>{tag}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.quote, { color: theme.mutedText }]}>“{item.quote}”</Text>

        <View style={styles.buttonRow}>
          <Pressable style={[styles.skipButton, { backgroundColor: theme.elevatedSurface }]}><Text style={[styles.skipText, { color: theme.text }]}>Skip</Text></Pressable>
          <Pressable
            style={[styles.saveButton, isSaved(item.id) && styles.savedButton]}
            onPress={() => savePlace(item)}
          >
            <Text style={styles.saveText}>{isSaved(item.id) ? 'Saved' : 'Save'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenContainer
      style={{ backgroundColor: theme.background }}
      contentStyle={styles.feedContent}
    >
      <View style={styles.feedHeader}>
        <Text style={[styles.eyebrow, { color: theme.mutedText }]}>Recommended for you</Text>
        <Text style={[styles.title, { color: theme.text }]}>For You</Text>
      </View>

      <FlatList
        style={styles.feed}
        data={data}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={cardHeight + 12}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={styles.feedList}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 12,
    color: '#E0EAFF',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
    marginBottom: 6,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 18,
  },
  feedList: {
    paddingBottom: 8,
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  feedHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 6,
  },
  placeCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    marginHorizontal: 20,
    marginBottom: 12,
    alignSelf: 'center',
    width: '90%',
    height: cardHeight,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  image: {
    height: height * 0.34,
    width: '100%',
  },
  content: {
    flex: 1,
    padding: 18,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#152033',
    flex: 1,
    marginRight: 10,
  },
  rating: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9A6700',
    backgroundColor: '#FFF8DC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  meta: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 12,
  },
  chip: {
    backgroundColor: '#EEF4FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    color: '#3557D8',
    fontSize: 12,
    fontWeight: '700',
  },
  quote: {
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
    fontStyle: 'italic',
    marginTop: 10,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  skipText: {
    color: '#3557D8',
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4C6FFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  savedButton: {
    backgroundColor: '#173B30',
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
  },
});
