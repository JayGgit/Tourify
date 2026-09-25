import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Dimensions, Image, ActivityIndicator } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { useSavedPlaces } from '../context/SavedPlacesContext';
import { useTheme } from '../context/ThemeContext';
import { ErrorState, LoadingState } from '../components/LoadState';
import { getRecommendedPlaces } from '../services/placesApi';
import { userProfile } from '../data/profile';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, runOnUI, useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

const { height, width } = Dimensions.get('window');
const cardHeight = height * 0.68;

function DraggableCard({ item, baseColor, onSwipeLeft, onSwipeRight, onSave, children }) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 180 });
  }, [item.id]);

  const dismissLeft = () => {
    'worklet';

    x.value = withTiming(-width, { duration: 220 }, (finished) => {
      if (finished) runOnJS(onSwipeLeft)(item.id);
    });
  };

  const dismissRight = () => {
    'worklet';

    x.value = withTiming(width, { duration: 220 }, (finished) => {
      if (finished) runOnJS(onSwipeRight)(item.id);
    });
  };

  const gesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-20, 20])
    .onUpdate((event) => {
      x.value = event.translationX;
    })
    .onEnd(() => {
      // Return naturally to its original position.
      if (x.value < -50) {
        dismissLeft();
        return;
      }
      if (x.value > 50) {
        runOnJS(onSave)(item);
        dismissRight();
        return;
      }
      x.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: x.value },
      { rotate: `${Math.max(-12, Math.min(12, x.value / 25))}deg` },
    ],
  }));

  const swipeFeedbackStyle = useAnimatedStyle(() => ({
    backgroundColor: x.value > 5 ? '#DCFCE7' : x.value < -5 ? '#FEE2E2' : baseColor,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={animatedStyle}>
        {children({
          onSkip: () => runOnUI(dismissLeft)(),
          onSave: () => {
            onSave(item);
            runOnUI(dismissRight)();
          },
          swipeFeedbackStyle,
        })}
      </Animated.View>
    </GestureDetector>
  );
}

export default function ForYouScreen() {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { isSaved, savePlace } = useSavedPlaces();
  const { theme } = useTheme();

  const loadPlaces = async () => {
    setStatus('loading');
    setError('');

    try {
      setData(await getRecommendedPlaces('LosAngeles', 0, userProfile));
      setHasMore(true);
      setStatus('success');
    } catch (loadError) {
      setError(loadError.message);
      setStatus('error');
    }
  };

  const loadMorePlaces = async () => {
    if (status !== 'success' || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const nextPlaces = await getRecommendedPlaces('LosAngeles', data.length, userProfile);
      const existingIds = new Set(data.map((place) => place.id));
      const uniquePlaces = nextPlaces.filter((place) => !existingIds.has(place.id));

      setData((currentPlaces) => [...currentPlaces, ...uniquePlaces]);
      setHasMore(uniquePlaces.length > 0);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSwipeLeft = (placeId) => {
    setData((currentPlaces) => currentPlaces.filter((place) => place.id !== placeId));
  };

  const handleSave = (place) => {
    savePlace(place);
  };

  useEffect(() => {
    loadPlaces();
  }, []);

  if (status === 'loading') return <LoadingState />;
  if (status === 'error') return <ErrorState message={error} onRetry={loadPlaces} />;

  const renderItem = ({ item }) => (
    <DraggableCard item={item} baseColor={theme.surface} onSave={handleSave} onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeLeft}>
      {({ onSkip, onSave, swipeFeedbackStyle }) => (
      <Animated.View style={[styles.placeCard, { backgroundColor: theme.surface, borderColor: theme.border }, isSaved(item.id) && styles.savedCard, swipeFeedbackStyle]}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, { backgroundColor: item.color }]} />
        )}
        <Animated.View style={[styles.content, { backgroundColor: theme.surface }, isSaved(item.id) && styles.savedContent, swipeFeedbackStyle]}>
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

          <View style={styles.buttonRow}>
            <Pressable style={[styles.skipButton, { backgroundColor: theme.elevatedSurface }]} onPress={onSkip}><Text style={[styles.skipText, { color: theme.text }]}>Skip</Text></Pressable>
            <Pressable
              style={[styles.saveButton, isSaved(item.id) && styles.savedButton]}
              onPress={onSave}
            >
              <Text style={styles.saveText}>{isSaved(item.id) ? 'Saved' : 'Save'}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
      )}
    </DraggableCard>
  );

  return (
    <ScreenContainer
      style={{ backgroundColor: theme.background }}
      contentStyle={styles.feedContent}
    >
      <View style={styles.feedLayout}>
        <View style={styles.feedHeader}>
          <Text style={[styles.eyebrow, { color: theme.mutedText }]}>Recommended for you</Text>
          <Text style={[styles.title, { color: theme.text }]}>For You</Text>
        </View>
        <FlatList
          style={styles.feed}
          data={data}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderItem}
          onEndReached={loadMorePlaces}
          onEndReachedThreshold={0.6}
          ListFooterComponent={isLoadingMore ? <ActivityIndicator style={styles.footer} color={theme.mutedText} /> : null}
          ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.mutedText }]}>No recommendations found.</Text>}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={cardHeight + 12}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={styles.feedList}
        />
      </View>
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
  footer: {
    marginVertical: 16,
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  feedLayout: {
    flex: 1,
  },
  feedHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 6,
  },
  emptyText: {
    padding: 20,
    textAlign: 'center',
  },
  placeCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
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
  savedCard: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
    borderWidth: 2,
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
  savedContent: {
    backgroundColor: '#DCFCE7',
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
