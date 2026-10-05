import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, FlatList } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { getRecommendedPlaces } from '../services/placesApi';
import { ErrorState, LoadingState } from '../components/LoadState';

export default function ForYouScreen() {
  const [places, setPlaces] = useState([]);
  const [error, setError] = useState('');

  const loadPlaces = () => {
    setError('');
    setPlaces([]);
    getRecommendedPlaces()
      .then(setPlaces)
      .catch((requestError) => setError(requestError.message));
  };

  useEffect(loadPlaces, []);

  if (error) return <ErrorState message={error} onRetry={loadPlaces} />;
  if (!places.length) return <LoadingState />;

  return (
    <ScreenContainer>
      <Text style={styles.title}>For You</Text>
      <FlatList
        data={places}
        keyExtractor={(place, index) => String(place.id || index)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.category}>{item.category || 'Recommended place'}</Text>
          </View>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800', color: '#152033', marginBottom: 18 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 12 },
  name: { fontSize: 18, fontWeight: '700', color: '#152033' },
  category: { color: '#64748B', marginTop: 6 },
});
