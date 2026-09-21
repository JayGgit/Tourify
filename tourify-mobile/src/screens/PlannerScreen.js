import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import ScreenContainer from '../components/ScreenContainer';
import { plannerItems as initialPlannerItems } from '../data/profile';
import { useTheme } from '../context/ThemeContext';

function timeToMinutes(time) {
  const match = String(time).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();

  if (hour < 1 || hour > 12 || minute > 59) return null;

  return ((hour % 12) + (period === 'PM' ? 12 : 0)) * 60 + minute;
}

function sortByTime(items) {
  return [...items].sort((first, second) => timeToMinutes(first.time) - timeToMinutes(second.time));
}

export default function PlannerScreen() {
  const [items, setItems] = useState(() => sortByTime(initialPlannerItems));
  const [editingId, setEditingId] = useState(null);
  const [draftTime, setDraftTime] = useState('');
  const [timeError, setTimeError] = useState('');
  const { theme } = useTheme();

  const startEditingTime = (item) => {
    setEditingId(item.id);
    setDraftTime(item.time);
    setTimeError('');
  };

  const saveTime = (itemId) => {
    if (timeToMinutes(draftTime) === null) {
      setTimeError('Use a time like 3:30 PM.');
      return;
    }

    setItems((currentItems) => sortByTime(currentItems.map((item) => (
      item.id === itemId ? { ...item, time: draftTime.trim().toUpperCase() } : item
    ))));
    setEditingId(null);
    setTimeError('');
  };

  const openMaps = () => {
    Linking.openURL('https://www.google.com/maps').catch(() => {});
  };

  const renderItem = ({ item, drag, isActive }) => (
    <Pressable
      onLongPress={drag}
      style={[
        styles.planCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
        isActive && { backgroundColor: theme.elevatedSurface },
      ]}
    >
      <View style={styles.timeRow}>
        {editingId === item.id ? (
          <View style={styles.timeEditor}>
            <TextInput
              value={draftTime}
              onChangeText={setDraftTime}
              style={[styles.timeInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
              placeholder="3:30 PM"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              onSubmitEditing={() => saveTime(item.id)}
              returnKeyType="done"
            />
            <Pressable style={styles.timeSaveButton} onPress={() => saveTime(item.id)}>
              <Text style={styles.timeSaveText}>Save</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={[styles.time, { color: theme.text }]}>{item.time}</Text>
            <Pressable style={[styles.editTimeButton, { backgroundColor: theme.elevatedSurface }]} onPress={() => startEditingTime(item)}>
              <Text style={[styles.editTimeText, { color: theme.text }]}>Edit time</Text>
            </Pressable>
          </>
        )}
      </View>
      {editingId === item.id && timeError ? <Text style={styles.timeError}>{timeError}</Text> : null}
      <View style={[styles.badge, { backgroundColor: theme.elevatedSurface }]}><Text style={[styles.badgeText, { color: theme.text }]}>{item.category}</Text></View>
      <Text style={[styles.planTitle, { color: theme.text }]}>{item.title}</Text>
      <Text style={[styles.note, { color: theme.mutedText }]}>{item.note}</Text>
    </Pressable>
  );

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <DraggableFlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onDragEnd={({ data }) => setItems(data)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={(
            <View>
              <Text style={[styles.eyebrow, { color: theme.mutedText }]}>Your itinerary</Text>
              <Text style={[styles.title, { color: theme.text }]}>Day Planner</Text>
            </View>
          )}
          ListFooterComponent={(
            <View style={styles.buttonRow}>
              <Pressable style={styles.primaryButton}><Text style={styles.primaryText}>Save Plan</Text></Pressable>
              <Pressable style={[styles.secondaryButton, { backgroundColor: theme.elevatedSurface }]} onPress={openMaps}><Text style={[styles.secondaryText, { color: theme.text }]}>Open in Maps</Text></Pressable>
            </View>
          )}
        />
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
  listContent: {
    paddingBottom: 16,
  },
  keyboardView: {
    flex: 1,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  activeCard: {
    backgroundColor: '#EEF4FF',
  },
  time: {
    fontSize: 12,
    color: '#3557D8',
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  timeRow: {
    minHeight: 28,
    justifyContent: 'center',
  },
  timeEditor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#152033',
    fontSize: 15,
  },
  timeSaveButton: {
    backgroundColor: '#4C6FFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  timeSaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  editTimeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#EEF4FF',
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  editTimeText: {
    color: '#3557D8',
    fontSize: 11,
    fontWeight: '700',
  },
  timeError: {
    color: '#B91C1C',
    fontSize: 12,
    marginTop: 5,
  },
  badge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#EEF4FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: '#3557D8',
    fontSize: 12,
    fontWeight: '700',
  },
  planTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#152033',
    marginTop: 12,
    marginBottom: 6,
  },
  note: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4C6FFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#152033',
    fontSize: 16,
    fontWeight: '700',
  },
});
