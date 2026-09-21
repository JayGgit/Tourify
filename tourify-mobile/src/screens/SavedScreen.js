import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Pressable } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { useSavedPlaces } from '../context/SavedPlacesContext';
import { useTheme } from '../context/ThemeContext';

export default function SavedScreen() {
  const [query, setQuery] = useState('');
  const { savedPlaces, removeSavedPlace } = useSavedPlaces();
  const { theme } = useTheme();

  const filteredPlaces = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) return savedPlaces;

    return savedPlaces.filter((place) => {
      const searchableText = [
        place.name,
        place.category,
        place.notes,
        ...(place.tags || []),
      ].join(' ').toLowerCase();

      return searchableText.includes(normalized);
    });
  }, [query, savedPlaces]);

  const renderPlace = ({ item: place }) => (
    <View style={[styles.savedCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.placeName, { color: theme.text }]}>{place.name}</Text>
        <Pressable style={styles.unsaveButton} onPress={() => removeSavedPlace(place.id)}>
          <Text style={styles.unsaveText}>Unsave</Text>
        </Pressable>
      </View>
      <View style={[styles.tag, { backgroundColor: theme.elevatedSurface }]}><Text style={[styles.tagText, { color: theme.text }]}>{place.category}</Text></View>
      <View style={styles.tagsRow}>
        {(place.tags || []).map((tag) => (
          <Text key={tag} style={[styles.searchTag, { color: theme.mutedText }]}>{tag}</Text>
        ))}
      </View>
      <Text style={[styles.rating, { color: theme.mutedText }]}>⭐ {place.rating}</Text>
      <Text style={[styles.notes, { color: theme.mutedText }]}>{place.notes}</Text>
    </View>
  );

  return (
    <ScreenContainer contentStyle={styles.screenContent} style={{ backgroundColor: theme.background }}>
      <FlatList
        data={filteredPlaces}
        keyExtractor={(place) => place.id}
        renderItem={renderPlace}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={(
          <View>
            <Text style={[styles.eyebrow, { color: theme.mutedText }]}>Your collection</Text>
            <Text style={[styles.title, { color: theme.text }]}>Saved Places</Text>
            <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={styles.searchIcon}>🔎</Text>
              <TextInput
                placeholder="Search saved places"
                placeholderTextColor={theme.mutedText}
                style={[styles.searchInput, { color: theme.text }]}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
        )}
        ListEmptyComponent={(
          <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
            <Text style={[styles.emptyText, { color: theme.mutedText }]}>No saved places match your search.</Text>
          </View>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingBottom: 0,
  },
  listContent: {
    paddingBottom: 24,
  },
  eyebrow: {
    fontSize: 12,
    color: '#4C6FFF',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
    marginBottom: 6,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#152033',
    marginBottom: 18,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: '#1F2937',
  },
  savedCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  placeName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#152033',
    marginBottom: 8,
  },
  unsaveButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  unsaveText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '700',
  },
  tag: {
    backgroundColor: '#EEF4FF',
    borderRadius: 999,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  tagText: {
    color: '#3557D8',
    fontSize: 12,
    fontWeight: '700',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  searchTag: {
    color: '#64748B',
    fontSize: 12,
    marginRight: 10,
    marginBottom: 4,
  },
  rating: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 8,
  },
  notes: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 15,
  },
});
