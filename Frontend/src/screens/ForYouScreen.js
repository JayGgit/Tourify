import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Dimensions, Image, ActivityIndicator, Modal, ScrollView, Linking, Platform } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { useSavedPlaces } from '../context/SavedPlacesContext';
import { useTheme } from '../context/ThemeContext';
import { ErrorState, LoadingState } from '../components/LoadState';
import { getRecommendedPlaces, getPlaceDetails } from '../services/placesApi';
import { useProfile } from '../context/ProfileContext';
import * as Location from 'expo-location';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, runOnUI, useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

const MapView = Platform.OS === 'web' ? null : require('react-native-maps').default;
const Marker = Platform.OS === 'web' ? null : require('react-native-maps').Marker;

const { height, width } = Dimensions.get('window');
const cardHeight = height * 0.68;
const menuImageWidth = width - 44;
const fallbackLocation = 'Los Angeles';

async function getUserLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    console.log("Location not found")
    return fallbackLocation;
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const [address] = await Location.reverseGeocodeAsync(position.coords);
  return [address?.city, address?.region, address?.country].filter(Boolean).join(', ') || fallbackLocation;
}

function openPlaceInMaps(place, latitude, longitude) {
  const name = encodeURIComponent(place?.name || 'Place');
  const mapUrl = Platform.select({
    ios: `http://maps.apple.com/?ll=${latitude},${longitude}&q=${name}`,
    android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${name})`,
    default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
  });

  Linking.openURL(mapUrl).catch(() => {});
}

function getPlaceHighlights(place) {
  if (Array.isArray(place?.highlights) && place.highlights.length) return place.highlights;

  return (place?.features || [])
    .filter((feature) => feature.is_active)
    .slice(0, 5)
    .map((feature) => feature.title);
}

function DraggableCard({ item, baseColor, onSwipeLeft, onSwipeRight, onSave, onPress, dismissPlaceId, children }) {
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

  useEffect(() => {
    if (dismissPlaceId === item.id) runOnUI(dismissRight)();
  }, [dismissPlaceId, item.id]);

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
          onPress: () => onPress(item),
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
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedPlaceDetail, setSelectedPlaceDetail] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [dismissPlaceId, setDismissPlaceId] = useState(null);
  const [location, setLocation] = useState(fallbackLocation);
  const detailCacheRef = useRef({});
  const detailRequestsRef = useRef({});
  const placeRequestIdRef = useRef(0);
  const menuTranslateY = useSharedValue(0);
  const { isSaved, savePlace } = useSavedPlaces();
  const { theme } = useTheme();
  const { profile } = useProfile();

  const loadPlaces = async () => {
    setStatus('loading');
    setError('');

    try {
      const currentLocation = await getUserLocation().catch(() => fallbackLocation);
      setLocation(currentLocation);
      setData(await getRecommendedPlaces(currentLocation, 0, profile));
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
      const nextPlaces = await getRecommendedPlaces(location, data.length, profile);
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

  const closePlaceMenu = () => {
    placeRequestIdRef.current += 1;
    setSelectedPlace(null);
  };

  const loadPlaceDetail = (place) => {
    if (detailCacheRef.current[place.id]) {
      return Promise.resolve(detailCacheRef.current[place.id]);
    }

    if (detailRequestsRef.current[place.id]) {
      return detailRequestsRef.current[place.id];
    }

    const request = getPlaceDetails(place.id)
      .then((details) => {
        detailCacheRef.current[place.id] = details;
        return details;
      })
      .finally(() => {
        delete detailRequestsRef.current[place.id];
      });

    detailRequestsRef.current[place.id] = request;
    return request;
  };

  const handlePlacePress = (place) => {
    const requestId = placeRequestIdRef.current + 1;
    const cachedDetails = detailCacheRef.current[place.id];
    placeRequestIdRef.current = requestId;
    setSelectedPlace(place);
    setSelectedPlaceDetail(cachedDetails || null);
    setIsLoadingDetails(!cachedDetails);

    loadPlaceDetail(place)
      .then((details) => {
        if (placeRequestIdRef.current === requestId) setSelectedPlaceDetail(details);
      })
      .catch((loadError) => {
        if (placeRequestIdRef.current === requestId) {
          console.error(loadError);
          setSelectedPlaceDetail(null);
        }
      })
      .finally(() => {
        if (placeRequestIdRef.current === requestId) setIsLoadingDetails(false);
      });
  };

  useEffect(() => {
    if (selectedPlace) menuTranslateY.value = 0;
  }, [selectedPlace]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedPlace]);

  useEffect(() => {
    data.slice(0, 3).forEach((place) => {
      loadPlaceDetail(place).catch(() => {});
    });
  }, [data]);

  useEffect(() => {
    if (!selectedPlace?.id) {
      setSelectedPlaceDetail(null);
      setIsLoadingDetails(false);
    }
  }, [selectedPlace]);

  const menuScrollGesture = Gesture.Native();
  const menuScrollOffset = useSharedValue(0);
  const menuGesture = Gesture.Pan()
    .activeOffsetY([10, 999])
    .failOffsetX([-30, 30])
    .simultaneousWithExternalGesture(menuScrollGesture)
    .onUpdate((event) => {
      if (menuScrollOffset.value <= 0 && event.translationY > 0) {
        menuTranslateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (menuScrollOffset.value <= 0 && event.translationY > 120) {
        menuTranslateY.value = withTiming(height, { duration: 180 }, (finished) => {
          if (finished) runOnJS(closePlaceMenu)();
        });
      } else {
        menuTranslateY.value = withSpring(0);
      }
    });

  const menuAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: menuTranslateY.value }],
  }));

  useEffect(() => {
    loadPlaces();
  }, [profile]);

  if (status === 'loading') return <LoadingState />;
  if (status === 'error') return <ErrorState message={error} onRetry={loadPlaces} />;

  const placeLatitude = Number(selectedPlace?.latitude);
  const placeLongitude = Number(selectedPlace?.longitude);
  const hasPlaceCoordinates = Number.isFinite(placeLatitude) && Number.isFinite(placeLongitude);

  const renderItem = ({ item }) => (
    <DraggableCard item={item} baseColor={theme.surface} onSave={handleSave} onPress={handlePlacePress} onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeLeft} dismissPlaceId={dismissPlaceId}>
      {({ onPress, onSkip, onSave, swipeFeedbackStyle }) => (
      <Pressable onPress={onPress}>
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
      </Pressable>
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

      <Modal
        visible={Boolean(selectedPlace)}
        transparent
        animationType="slide"
        onRequestClose={closePlaceMenu}
      >
        <GestureDetector gesture={menuGesture}>
          <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={closePlaceMenu} />
            <Animated.View style={[styles.placeMenu, { backgroundColor: theme.surface }, menuAnimatedStyle]}>
            <View style={[styles.menuHandle, { backgroundColor: theme.border }]} />
            <View style={styles.menuHeader}>
              <View style={styles.menuHeading}>
                <Text style={[styles.menuEyebrow, { color: theme.mutedText }]}>DETAILS</Text>
                <Text style={[styles.menuTitle, { color: theme.text }]}>
                  {selectedPlace?.name || 'Place name'}
                </Text>
              </View>
            </View>
            <GestureDetector gesture={menuScrollGesture}>
              <ScrollView
                style={styles.menuScroll}
                contentContainerStyle={styles.menuScrollContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                scrollEventThrottle={16}
                onScroll={(event) => {
                  const scrollOffset = event.nativeEvent.contentOffset.y;
                  menuScrollOffset.value = scrollOffset;
                  if (scrollOffset < -80) {
                    closePlaceMenu()
                  };
                }}
              >
            {isLoadingDetails ? (
              <View style={[styles.menuImage, styles.loadingImage, { backgroundColor: theme.elevatedSurface }]}>
                <ActivityIndicator size="large" color={theme.text} />
              </View>
            ) : selectedPlaceDetail?.images?.length ? (
              <>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  style={styles.menuImage}
                  onMomentumScrollEnd={(event) => {
                    setActiveImageIndex(Math.round(event.nativeEvent.contentOffset.x / menuImageWidth));
                  }}
                >
                  {selectedPlaceDetail.images.map((imageUrl, index) => (
                    <Image
                      key={`${imageUrl}-${index}`}
                      source={{ uri: imageUrl }}
                      style={[styles.menuImageSlide, { backgroundColor: theme.elevatedSurface }]}
                      resizeMode="contain"
                    />
                  ))}
                </ScrollView>
                <View style={styles.imageDots}>
                  {selectedPlaceDetail.images.map((imageUrl, index) => (
                    <View
                      key={`${imageUrl}-dot-${index}`}
                      style={[styles.imageDot, { backgroundColor: index === activeImageIndex ? theme.text : theme.border }]}
                    />
                  ))}
                </View>
              </>
            ) : (
              <View style={[styles.menuImage, { backgroundColor: selectedPlace?.color || theme.elevatedSurface }]} />
            )}
            <Text style={[styles.menuMeta, { color: theme.mutedText }]}>
              {selectedPlace?.category || 'Category'}  •  {selectedPlaceDetail?.address || selectedPlace?.distance || 'Loading'}
            </Text>
            <Text style={[styles.menuContact, { color: theme.mutedText }]}>
              {selectedPlaceDetail?.phone || 'Phone loading'}  •  {selectedPlaceDetail?.price || 'Price loading'}
            </Text>
            <View style={[styles.menuStats, { borderColor: theme.border }]}>
              <View>
                <Text style={[styles.statLabel, { color: theme.mutedText }]}>RATING</Text>
                <Text style={[styles.statValue, { color: theme.text }]}>⭐ {selectedPlaceDetail?.rating || selectedPlace?.rating || 'Loading'}</Text>
              </View>
              <View>
                <Text style={[styles.statLabel, { color: theme.mutedText }]}>REVIEWS</Text>
                <Pressable
                  accessibilityRole="link"
                  disabled={!selectedPlaceDetail?.reviewsUrl}
                  onPress={() => Linking.openURL(selectedPlaceDetail.reviewsUrl)}
                >
                  <Text style={[styles.statValue, selectedPlaceDetail?.reviewsUrl && styles.menuLink, { color: theme.text }]}>
                    {selectedPlaceDetail?.reviews ? `${selectedPlaceDetail.reviews} reviews` : selectedPlace?.reviews || 'Loading'}
                  </Text>
                </Pressable>
              </View>
            </View>
            {selectedPlaceDetail?.full_menu ? (
              <Pressable
                accessibilityRole="link"
                onPress={() => Linking.openURL(selectedPlaceDetail.full_menu)}
              >
                <Text style={[styles.menuDetail, styles.menuLink, { color: theme.text }]}>View menu on Yelp</Text>
              </Pressable>
            ) : null}
            <Text style={[styles.menuDetail, { color: theme.mutedText }]}>
              {selectedPlaceDetail?.website || 'Website loading'}
            </Text>
            <Text style={[styles.menuDetail, { color: theme.mutedText }]}>
              {getPlaceHighlights(selectedPlaceDetail).join(', ') || 'Highlights loading'}
            </Text>
            <Text style={[styles.menuDetail, { color: theme.mutedText }]}>
              {selectedPlaceDetail?.categories?.map((category) => category.title).join(', ') || 'Categories loading'}
            </Text>
            <Text style={[styles.menuDetail, { color: theme.mutedText }]}>
              Hours: {selectedPlaceDetail?.operation_hours?.hours?.[0]?.hours || 'Hours loading'}
            </Text>
            {hasPlaceCoordinates && Platform.OS !== 'web' ? (
              <MapView
                style={styles.menuMap}
                onPress={() => openPlaceInMaps(selectedPlace, placeLatitude, placeLongitude)}
                initialRegion={{
                  latitude: placeLatitude,
                  longitude: placeLongitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{ latitude: placeLatitude, longitude: placeLongitude }}
                  title={selectedPlace?.name}
                />
              </MapView>
            ) : hasPlaceCoordinates ? (
              <Pressable
                style={[styles.menuMap, styles.webMapFallback]}
                onPress={() => openPlaceInMaps(selectedPlace, placeLatitude, placeLongitude)}
              >
                <Text style={styles.webMapFallbackText}>Open location in Google Maps</Text>
              </Pressable>
            ) : null}
            <View style={styles.menuActions}>
              <Pressable style={[styles.menuSecondaryButton, { borderColor: theme.border }]} onPress={closePlaceMenu}>
                <Text style={[styles.menuSecondaryText, { color: theme.text }]}>Close</Text>
              </Pressable>
              <Pressable
                style={[styles.menuPrimaryButton, isSaved(selectedPlace?.id) && styles.savedButton]}
                onPress={() => {
                  if (selectedPlace) {
                    handleSave(selectedPlace);
                    setDismissPlaceId(selectedPlace.id);
                  }
                  closePlaceMenu();
                }}
              >
                <Text style={styles.menuPrimaryText}>{isSaved(selectedPlace?.id) ? 'Saved' : 'Save place'}</Text>
              </Pressable>
            </View>
              </ScrollView>
            </GestureDetector>
            </Animated.View>
          </View>
        </GestureDetector>
      </Modal>
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
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  placeMenu: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
  },
  menuScroll: {
    maxHeight: height * 0.78,
  },
  menuScrollContent: {
    paddingBottom: 4,
  },
  menuHandle: {
    alignSelf: 'center',
    borderRadius: 99,
    height: 5,
    marginBottom: 18,
    width: 42,
  },
  menuHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  menuHeading: {
    flex: 1,
    marginRight: 16,
  },
  menuEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 5,
  },
  menuTitle: {
    fontSize: 26,
    fontWeight: '800',
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  menuMeta: {
    fontSize: 14,
    marginTop: 8,
  },
  menuContact: {
    fontSize: 14,
    marginTop: 6,
  },
  menuDetail: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  menuMap: {
    borderRadius: 14,
    height: 190,
    marginTop: 14,
    overflow: 'hidden',
    width: '100%',
  },
  webMapFallback: {
    alignItems: 'center',
    backgroundColor: '#E8EEF7',
    justifyContent: 'center',
  },
  webMapFallbackText: {
    color: '#2454A6',
    fontSize: 14,
    fontWeight: '700',
  },
  menuLink: {
    textDecorationLine: 'underline',
  },
  menuImage: {
    aspectRatio: 16 / 9,
    borderRadius: 14,
    marginTop: 14,
    overflow: 'hidden',
    width: '100%',
  },
  menuImageSlide: {
    aspectRatio: 16 / 9,
    width: menuImageWidth,
  },
  loadingImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageDots: {
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    marginTop: 8,
  },
  imageDot: {
    borderRadius: 4,
    height: 6,
    width: 6,
  },
  menuStats: {
    borderBottomWidth: 1,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 42,
    marginTop: 20,
    paddingVertical: 14,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 3,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  menuDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 16,
  },
  menuActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  menuSecondaryButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 13,
  },
  menuSecondaryText: {
    fontWeight: '700',
  },
  menuPrimaryButton: {
    alignItems: 'center',
    backgroundColor: '#4C6FFF',
    borderRadius: 12,
    flex: 1.3,
    justifyContent: 'center',
    paddingVertical: 13,
  },
  menuPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
