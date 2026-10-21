import React, { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { LayoutAnimation, View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, Linking, Modal, ScrollView } from 'react-native';
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

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PlannerScreen() {
  const [editingId, setEditingId] = useState(null);
  const [draftTime, setDraftTime] = useState('');
  const [timeError, setTimeError] = useState('');
  const [showSavedPlans, setShowSavedPlans] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const today = dateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(`${today}T12:00:00`));
  const [planName, setPlanName] = useState('');
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');
  const { items, setItems, hiddenItems, savedPlans, savePlan, updatePlan, deletePlan, loadPlan, removeFromPlanner, hideFromPlanner, restoreHidden } = usePlanner();
  const { theme } = useTheme();
  const days = useMemo(() => {
    const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const last = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);
    const result = Array(first.getDay()).fill(null);
    for (let day = 1; day <= last.getDate(); day += 1) result.push(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day));
    return result;
  }, [visibleMonth]);

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
    savePlan(planName, selectedDate);
    setPlanName('');
    Alert.alert('Plan saved', `${items.length} stops are saved for ${formatDate(selectedDate)}.`);
  };

  const beginEditPlan = (plan) => {
    setEditingPlanId(plan.id);
    setEditName(plan.name);
    setEditDate(plan.date);
  };

  const finishEditPlan = (planId) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(editDate)) {
      Alert.alert('Invalid date', 'Use a date in YYYY-MM-DD format.');
      return;
    }
    updatePlan(planId, { name: editName, date: editDate });
    setEditingPlanId(null);
    setSelectedDate(editDate);
  };

  const selectCalendarDate = (date) => {
    setSelectedDate(date);
    const plan = savedPlans.find((savedPlan) => savedPlan.date === date);
    if (plan) loadPlan(plan);
  };

  const removeSavedPlan = (planId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    deletePlan(planId);
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
              <Pressable
                style={[styles.calendarToggle, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => setShowCalendar((current) => !current)}
              >
                <View>
                  <Text style={[styles.panelTitle, { color: theme.text }]}>Calendar itinerary</Text>
                  <Text style={[styles.sectionMeta, { color: theme.mutedText }]}>Selected: {formatDate(selectedDate)}</Text>
                </View>
                <Text style={[styles.expandText, { color: theme.text }]}>{showCalendar ? 'Hide' : 'Show'}</Text>
              </Pressable>
              {showCalendar ? <View style={[styles.calendarCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.calendarHeader}>
                  <Pressable style={styles.navButton} onPress={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>
                    <Text style={[styles.navText, { color: theme.text }]}>‹</Text>
                  </Pressable>
                  <Text style={[styles.monthTitle, { color: theme.text }]}>{MONTHS[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}</Text>
                  <Pressable style={styles.navButton} onPress={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>
                    <Text style={[styles.navText, { color: theme.text }]}>›</Text>
                  </Pressable>
                </View>
                <View style={styles.weekRow}>{WEEKDAYS.map((day) => <Text key={day} style={[styles.weekday, { color: theme.mutedText }]}>{day}</Text>)}</View>
                <View style={styles.daysGrid}>
                  {days.map((day, index) => {
                    if (!day) return <View key={`empty-${index}`} style={styles.dayCell} />;
                    const key = dateKey(day);
                    const selected = selectedDate === key;
                    const hasPlans = savedPlans.some((plan) => plan.date === key);
                    return (
                      <Pressable key={key} style={[styles.dayCell, selected && styles.selectedDay]} onPress={() => selectCalendarDate(key)}>
                        <Text style={[styles.dayText, { color: selected ? '#FFFFFF' : theme.text }]}>{day.getDate()}</Text>
                        {hasPlans ? <View style={[styles.planDot, { backgroundColor: selected ? '#FFFFFF' : '#4C6FFF' }]} /> : null}
                      </Pressable>
                    );
                  })}
                </View>
                <Pressable onPress={() => { setSelectedDate(today); setVisibleMonth(new Date(`${today}T12:00:00`)); }}>
                  <Text style={styles.todayLink}>Jump to today</Text>
                </Pressable>
              </View> : null}
              <View style={[styles.savePanel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.panelTitle, { color: theme.text }]}>Plans for {formatDate(selectedDate)}</Text>
                <Text style={[styles.sectionMeta, { color: theme.mutedText }]}>{items.length} current stop{items.length === 1 ? '' : 's'} will be saved.</Text>
                <View style={styles.saveRow}>
                  <TextInput value={planName} onChangeText={setPlanName} placeholder="Name this plan" placeholderTextColor="#94A3B8" style={[styles.planNameInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} />
                  <Pressable style={styles.saveButton} onPress={handleSavePlan}><Text style={styles.primaryText}>Save plan</Text></Pressable>
                </View>
              </View>
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
              {savedPlans.length === 0 ? <Text style={[styles.emptyText, { color: theme.mutedText }]}>No saved plans yet.</Text> : <ScrollView style={styles.savedPlansScroll} contentContainerStyle={styles.savedPlansContent}>
                {savedPlans.map((plan) => (
                <Swipeable key={plan.id} renderRightActions={() => (
                  <View style={styles.planSwipeAction}><Text style={styles.actionText}>Remove</Text></View>
                )} onSwipeableOpen={() => removeSavedPlan(plan.id)}>
                <View style={[styles.savedPlanRow, { borderColor: theme.border }]}>
                  {editingPlanId === plan.id ? (
                    <View style={styles.editPlanFields}>
                      <TextInput value={editName} onChangeText={setEditName} style={[styles.planNameInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} />
                      <TextInput value={editDate} onChangeText={setEditDate} placeholder="YYYY-MM-DD" autoCapitalize="none" style={[styles.dateInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} />
                    </View>
                  ) : (
                    <View style={styles.planInfo}>
                      <Text style={[styles.savedPlanTitle, { color: theme.text }]}>{plan.name}</Text>
                      <Text style={[styles.savedPlanMeta, { color: theme.mutedText }]}>{formatDate(plan.date)} · {plan.items.length} stops</Text>
                    </View>
                  )}
                  <View style={styles.planActions}>
                    {editingPlanId === plan.id ? <Pressable onPress={() => finishEditPlan(plan.id)}><Text style={styles.actionText}>Done</Text></Pressable> : (
                      <>
                        <Pressable onPress={() => { loadPlan(plan); setSelectedDate(plan.date); setShowSavedPlans(false); }}><Text style={styles.actionText}>Open</Text></Pressable>
                        <Pressable onPress={() => beginEditPlan(plan)}><Text style={styles.actionText}>Edit</Text></Pressable>
                      </>
                    )}
                    <Pressable onPress={() => removeSavedPlan(plan.id)}><Text style={styles.deleteText}>Remove</Text></Pressable>
                  </View>
                </View>
                </Swipeable>
                ))}
              </ScrollView>}
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
  calendarCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  calendarToggle: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expandText: { fontSize: 13, fontWeight: '800' },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  navButton: { paddingHorizontal: 12, paddingVertical: 4 },
  navText: { fontSize: 30, lineHeight: 32 },
  monthTitle: { fontSize: 19, fontWeight: '800' },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekday: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.2857%', minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  selectedDay: { backgroundColor: '#4C6FFF' },
  dayText: { fontSize: 14, fontWeight: '700' },
  planDot: { width: 5, height: 5, borderRadius: 3, marginTop: 3 },
  todayLink: { color: '#4C6FFF', fontWeight: '700', textAlign: 'center', marginTop: 10 },
  savePanel: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 16 },
  sectionMeta: { fontSize: 13, marginTop: 4, marginBottom: 12 },
  saveRow: { flexDirection: 'row', alignItems: 'center' },
  planNameInput: { flex: 1, minHeight: 42, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 14 },
  saveButton: { backgroundColor: '#4C6FFF', borderRadius: 10, paddingHorizontal: 14, minHeight: 42, justifyContent: 'center', marginLeft: 8 },
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
  savedPlansScroll: { maxHeight: 360 },
  savedPlansContent: { paddingBottom: 8 },
  planSwipeAction: {
    width: 92,
    marginBottom: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B91C1C',
  },
  planInfo: { flex: 1 },
  planActions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
  editPlanFields: { width: '100%' },
  dateInput: { minHeight: 40, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, fontSize: 13, marginTop: 8 },
  deleteText: { color: '#B91C1C', fontWeight: '800', fontSize: 13 },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 20,
  },
});
