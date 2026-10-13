import { AppUser, getCurrentUser, getUsersDatabase, saveUsersDatabase, setCurrentUser } from '@/lib/database';

export type { AppUser } from '@/lib/database';

export async function getAllUsers(): Promise<AppUser[]> {
  return getUsersDatabase();
}

export async function createUser(data: { name: string; email: string; password: string }): Promise<AppUser | null> {
  const users = await getAllUsers();
  const email = data.email.trim().toLowerCase();

  if (!data.name.trim() || !email || !data.password.trim()) {
    return null;
  }

  const existing = users.find((user) => user.email.toLowerCase() === email);
  if (existing) {
    return null;
  }

  const user: AppUser = {
    id: `${Date.now()}`,
    name: data.name.trim(),
    email,
    password: data.password,
    bio: 'Adventure-first traveler',
    preferences: ['Outdoors', 'Food', 'Family'],
  };

  const nextUsers = [...users, user];
  await saveUsersDatabase(nextUsers);
  await setCurrentUser(user);
  return user;
}

export async function loginUser(email: string, password: string): Promise<AppUser | null> {
  const users = await getAllUsers();
  const match = users.find(
    (user) => user.email.toLowerCase() === email.trim().toLowerCase() && user.password === password
  );

  if (!match) {
    return null;
  }

  await setCurrentUser(match);
  return match;
}

export async function signOut(): Promise<void> {
  await setCurrentUser(null);
}

export { getCurrentUser } from '@/lib/database';
