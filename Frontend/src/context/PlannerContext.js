import React, { createContext, useContext, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { plannerItems as initialPlannerItems } from '../data/profile';

const PlannerContext = createContext(null);
const SAVED_PLAN_KEY = 'tourify.savedPlan';

function toPlannerItem(place, index) {
  return {
    id: `saved-${place.id}`,
    time: '6:00 PM',
    category: place.category || 'Place',
    title: place.name,
    note: place.notes || 'Added from your saved places.',
    sourceId: place.id,
    order: index,
  };
}

export function PlannerProvider({ children }) {
  const [items, setItems] = useState(() => [...initialPlannerItems]);
  const [hiddenItems, setHiddenItems] = useState([]);
  const [savedPlans, setSavedPlans] = useState([]);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  React.useEffect(() => {
    AsyncStorage.getItem(SAVED_PLAN_KEY).then((savedPlan) => {
      if (!savedPlan) return;

      try {
        const parsedPlan = JSON.parse(savedPlan);
        if (Array.isArray(parsedPlan.items)) setItems(parsedPlan.items);
        if (Array.isArray(parsedPlan.hiddenItems)) setHiddenItems(parsedPlan.hiddenItems);
        if (Array.isArray(parsedPlan.savedPlans)) setSavedPlans(parsedPlan.savedPlans);
        if (parsedPlan.savedAt) setLastSavedAt(parsedPlan.savedAt);
      } catch {
        AsyncStorage.removeItem(SAVED_PLAN_KEY);
      }
    }).catch(() => {});
  }, []);

  const value = useMemo(() => ({
    items,
    setItems,
    hiddenItems,
    savedPlans,
    isInPlanner: (placeId) => items.some((item) => item.sourceId === placeId || item.id === placeId),
    addToPlanner: (place) => {
      setItems((currentItems) => {
        if (currentItems.some((item) => item.sourceId === place.id || item.id === place.id)) {
          return currentItems;
        }

        return [...currentItems, toPlannerItem(place, currentItems.length)];
      });
    },
    removeFromPlanner: (itemId) => {
      setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
    },
    hideFromPlanner: (itemId) => {
      setItems((currentItems) => {
        const itemToHide = currentItems.find((item) => item.id === itemId);
        if (itemToHide) setHiddenItems((currentHidden) => [...currentHidden, itemToHide]);
        return currentItems.filter((item) => item.id !== itemId);
      });
    },
    restoreHidden: (itemId) => {
      setHiddenItems((currentHidden) => {
        const itemToRestore = currentHidden.find((item) => item.id === itemId);
        if (itemToRestore) setItems((currentItems) => [...currentItems, itemToRestore]);
        return currentHidden.filter((item) => item.id !== itemId);
      });
    },
    savePlan: () => {
      const savedAt = new Date().toISOString();
      const savedPlan = {
        id: savedAt,
        savedAt,
        items: [...items],
      };
      setLastSavedAt(savedAt);
      setSavedPlans((currentPlans) => [savedPlan, ...currentPlans]);
      AsyncStorage.setItem(SAVED_PLAN_KEY, JSON.stringify({
        items,
        hiddenItems,
        savedPlans: [savedPlan, ...savedPlans],
        savedAt,
      })).catch(() => {});
    },
    lastSavedAt,
  }), [items, lastSavedAt]);

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner() {
  const context = useContext(PlannerContext);

  if (!context) {
    throw new Error('usePlanner must be used inside PlannerProvider');
  }

  return context;
}
