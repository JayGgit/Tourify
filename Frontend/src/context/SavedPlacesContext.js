import React, { createContext, useContext, useMemo, useState } from 'react';
import { savedPlaces as initialSavedPlaces } from '../data/profile';

const SavedPlacesContext = createContext(null);

function toSavedPlace(place) {
  return {
    id: place.id,
    name: place.name,
    category: place.category,
    tags: place.tags.map((tag) => tag.toLowerCase()), //later
    rating: place.rating,
    notes: place.quote,
  };
}

export function SavedPlacesProvider({ children }) {
  const [savedPlaces, setSavedPlaces] = useState(initialSavedPlaces);

  const value = useMemo(() => ({
    savedPlaces,
    isSaved: (placeId) => savedPlaces.some((place) => place.id === placeId),
    savePlace: (place) => {
      setSavedPlaces((currentPlaces) => {
        if (currentPlaces.some((savedPlace) => savedPlace.id === place.id)) {
          return currentPlaces;
        }

        return [...currentPlaces, toSavedPlace(place)];
      });
    },
    removeSavedPlace: (placeId) => {
      setSavedPlaces((currentPlaces) => currentPlaces.filter((place) => place.id !== placeId));
    },
  }), [savedPlaces]);

  return (
    <SavedPlacesContext.Provider value={value}>
      {children}
    </SavedPlacesContext.Provider>
  );
}

export function useSavedPlaces() {
  const context = useContext(SavedPlacesContext);

  if (!context) {
    throw new Error('useSavedPlaces must be used inside SavedPlacesProvider');
  }

  return context;
}