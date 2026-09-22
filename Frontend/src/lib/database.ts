import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  bio: string;
  preferences: string[];
};

const USERS_DB_KEY = 'tourify_users_db';
const CURRENT_USER_KEY = 'tourify_current_user';

export async function getUsersDatabase(): Promise<AppUser[]> {
  try {
    const raw = await AsyncStorage.getItem(USERS_DB_KEY);
    return raw ? (JSON.parse(raw) as AppUser[]) : [];
  } catch {
    return [];
  }
}

export async function saveUsersDatabase(users: AppUser[]): Promise<void> {
  await AsyncStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
}

export async function getCurrentUser(): Promise<AppUser | null> {
  try {
    const raw = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return raw ? (JSON.parse(raw) as AppUser) : null;
  } catch {
    return null;
  }
}

export async function setCurrentUser(user: AppUser | null): Promise<void> {
  if (!user) {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    return;
  }

  await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}
