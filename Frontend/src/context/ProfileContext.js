import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userProfile } from '../data/profile';

const ProfileContext = createContext(null);

function profileKey(email) {
  return `tourify.profile.${String(email || 'anonymous').trim().toLowerCase()}`;
}

export function ProfileProvider({ email, children }) {
  const [profile, setProfile] = useState({ ...userProfile, email });

  useEffect(() => {
    let active = true;

    setProfile({ ...userProfile, email });
    AsyncStorage.getItem(profileKey(email))
      .then((storedProfile) => {
        if (!active || !storedProfile) return;
        try {
          setProfile({ ...userProfile, ...JSON.parse(storedProfile), email });
        } catch {
          AsyncStorage.removeItem(profileKey(email));
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [email]);

  const updateProfile = (updates) => {
    setProfile((currentProfile) => {
      const nextProfile = { ...currentProfile, ...updates, email };
      AsyncStorage.setItem(profileKey(email), JSON.stringify(nextProfile)).catch(() => {});
      return nextProfile;
    });
  };

  const value = useMemo(() => ({ profile, updateProfile }), [profile]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used inside ProfileProvider');
  return context;
}
