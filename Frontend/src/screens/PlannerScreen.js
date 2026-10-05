import React, { useState } from 'react';
import { Alert } from 'react-native';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, Linking, Modal } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { Swipeable } from 'react-native-gesture-handler';
import ScreenContainer from '../components/ScreenContainer';
import { usePlanner } from '../context/PlannerContext';
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
  const [editingId, setEditingId] = useState(null);
  const [draftTime, setDraftTime] = useState('');
  const [timeError, setTimeError] = useState('');
  const [showSavedPlans, setShowSavedPlans] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const { items, setItems, hiddenItems, savedPlans, savePlan, removeFromPlanner, hideFromPlanner, restoreHidden } = usePlanner();
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

  const handleSavePlan = () => {
    savePlan();
    Alert.alert('Plan saved', `${items.length} stops are saved to your day planner.`);
  };

  const renderSwipeActions = (item) => (
    <View style={styles.swipeActions}>
      <Pressable style={styles.hideButton} onPress={() => hideFromPlanner(item.id)}>
        <Text style={styles.actionText}>Hide</Text>
      </Pressable>
      <Pressable style={styles.deleteButton} onPress={() => removeFromPlanner(item.id)}>
        <Text style={styles.actionText}>Delete</Text>
      </Pressable>
    </View>
  );

  const renderItem = ({ item, drag, isActive }) => (
    <Swipeable renderRightActions={() => renderSwipeActions(item)}>
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
    </Swipeable>
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
              <View style={styles.topActions}>
                <Pressable style={styles.utilityButton} onPress={() => setShowSavedPlans(true)}>
                  <Text style={styles.utilityText}>View saved plans</Text>
                </Pressable>
                <Pressable style={[styles.utilityButton, { backgroundColor: theme.elevatedSurface }]} onPress={() => setShowHidden((current) => !current)}>
                  <Text style={[styles.utilityText, { color: theme.text }]}>Hidden ({hiddenItems.length})</Text>
                </Pressable>
              </View>
              {showHidden && hiddenItems.length > 0 ? (
                <View style={[styles.hiddenPanel, { backgroundColor: theme.elevatedSurface }]}>
                  <Text style={[styles.panelTitle, { color: theme.text }]}>Hidden places</Text>
                  {hiddenItems.map((item) => (
                    <View key={item.id} style={styles.hiddenRow}>
                      <Text style={[styles.hiddenName, { color: theme.text }]}>{item.title}</Text>
                      <Pressable style={styles.restoreButton} onPress={() => restoreHidden(item.id)}>
                        <Text style={styles.restoreText}>Restore</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          )}
          ListFooterComponent={(
            <View style={styles.buttonRow}>
              <Pressable style={styles.primaryButton} onPress={handleSavePlan}>
                <Text style={styles.primaryText}>Save Plan</Text>
              </Pressable>
              <Pressable style={[styles.secondaryButton, { backgroundColor: theme.elevatedSurface }]} onPress={openMaps}><Text style={[styles.secondaryText, { color: theme.text }]}>Open in Maps</Text></Pressable>
            </View>
          )}
        />
        <Modal visible={showSavedPlans} animationType="slide" transparent onRequestClose={() => setShowSavedPlans(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Saved plans</Text>
                <Pressable onPress={() => setShowSavedPlans(false)}><Text style={[styles.closeText, { color: theme.text }]}>Close</Text></Pressable>
              </View>
              {savedPlans.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.mutedText }]}>No saved plans yet.</Text>
              ) : savedPlans.map((plan) => (
                <View key={plan.id} style={[styles.savedPlanRow, { borderColor: theme.border }]}>
                  <Text style={[styles.savedPlanTitle, { color: theme.text }]}>{new Date(plan.savedAt).toLocaleString()}</Text>
                  <Text style={[styles.savedPlanMeta, { color: theme.mutedText }]}>{plan.items.length} stops</Text>
                </View>
              ))}
            </View>
          </View>
        </Modal>
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
  topActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  utilityButton: {
    backgroundColor: '#4C6FFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  utilityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  hiddenPanel: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  hiddenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  hiddenName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 10,
  },
  restoreButton: {
    backgroundColor: '#4C6FFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  restoreText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 16,
    borderRadius: 18,
    overflow: 'hidden',
  },
  hideButton: {
    width: 76,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#64748B',
  },
  deleteButton: {
    width: 82,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B91C1C',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
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
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: 240,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  closeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  savedPlanRow: {
    borderBottomWidth: 1,
    paddingVertical: 13,
  },
  savedPlanTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  savedPlanMeta: {
    fontSize: 13,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 20,
  },
});
