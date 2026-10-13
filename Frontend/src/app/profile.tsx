import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppUser, getCurrentUser, signOut } from '@/lib/auth';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);

  useFocusEffect(
    useCallback(() => {
      const loadUser = async () => {
        const current = await getCurrentUser();
        setUser(current);
      };

      loadUser();
    }, [])
  );

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No profile yet</Text>
          <Text style={styles.emptyText}>Create an account to personalize your Tourify experience.</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.replace('/login')}>
            <Text style={styles.primaryText}>Go to login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <View style={styles.avatarSilhouetteHead} />
            <View style={styles.avatarSilhouetteBody} />
          </View>
        </View>

        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Bio</Text>
          <Text style={styles.infoText}>{user.bio}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Preferences</Text>
          <Text style={styles.infoText}>{user.preferences.join(', ')}</Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={handleSignOut}>
          <Text style={styles.primaryText}>Log out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4efe7', padding: 20 },
  emptyCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: { fontSize: 26, fontWeight: '700', color: '#1d5a4d' },
  emptyText: { color: '#4d655f', textAlign: 'center' },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#edf4ee',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1d5a4d',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  avatarSilhouetteHead: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    position: 'absolute',
    top: 12,
  },
  avatarSilhouetteBody: {
    width: 34,
    height: 26,
    borderRadius: 12,
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 10,
  },
  name: { fontSize: 28, fontWeight: '700', color: '#1d5a4d' },
  email: { color: '#4d655f' },
  infoBox: {
    width: '100%',
    backgroundColor: '#f7faf7',
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  infoLabel: { color: '#1d5a4d', fontWeight: '700' },
  infoText: { color: '#4d655f' },
  primaryButton: {
    backgroundColor: '#1d5a4d',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  primaryText: { color: '#fff', fontWeight: '700' },
});
