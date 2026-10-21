import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { usePlanner } from '../context/PlannerContext';
import { useTheme } from '../context/ThemeContext';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function PlannerScreen() {
  const { items, savedPlans, savePlan, updatePlan, deletePlan, loadPlan } = usePlanner();
  const { theme } = useTheme();
  const today = dateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(`${today}T12:00:00`));
  const [planName, setPlanName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');

  const days = useMemo(() => {
    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const lastDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);
    const result = [];
    for (let index = 0; index < firstDay.getDay(); index += 1) result.push(null);
    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      result.push(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day));
    }
    return result;
  }, [visibleMonth]);

  const selectedPlans = savedPlans.filter((plan) => plan.date === selectedDate);
  const saveCurrentPlan = () => {
    savePlan(planName, selectedDate);
    setPlanName('');
  };

  const moveMonth = (amount) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  const beginEdit = (plan) => {
    setEditingId(plan.id);
    setEditName(plan.name);
    setEditDate(plan.date);
  };

  const finishEdit = (planId) => {
    updatePlan(planId, { name: editName, date: editDate });
    setEditingId(null);
  };

  return (
    <ScreenContainer contentStyle={styles.content}>
      <Text style={[styles.eyebrow, { color: theme.mutedText }]}>Your itinerary</Text>
      <Text style={[styles.title, { color: theme.text }]}>Day Planner</Text>
      <Text style={[styles.subtitle, { color: theme.mutedText }]}>
        Choose a day, save your current stops, and keep every itinerary ready for later.
      </Text>

      <View style={[styles.calendarCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.calendarHeader}>
          <Pressable style={styles.navButton} onPress={() => moveMonth(-1)}><Text style={[styles.navText, { color: theme.text }]}>‹</Text></Pressable>
          <Text style={[styles.monthTitle, { color: theme.text }]}>{MONTHS[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}</Text>
          <Pressable style={styles.navButton} onPress={() => moveMonth(1)}><Text style={[styles.navText, { color: theme.text }]}>›</Text></Pressable>
        </View>
        <View style={styles.weekRow}>{WEEKDAYS.map((day) => <Text key={day} style={[styles.weekday, { color: theme.mutedText }]}>{day}</Text>)}</View>
        <View style={styles.daysGrid}>
          {days.map((day, index) => {
            if (!day) return <View key={`empty-${index}`} style={styles.dayCell} />;
            const key = dateKey(day);
            const hasPlans = savedPlans.some((plan) => plan.date === key);
            const selected = selectedDate === key;
            return (
              <Pressable
                key={key}
                style={[styles.dayCell, selected && styles.selectedDay]}
                onPress={() => setSelectedDate(key)}
              >
                <Text style={[styles.dayText, { color: selected ? '#FFFFFF' : theme.text }]}>{day.getDate()}</Text>
                {hasPlans ? <View style={[styles.planDot, { backgroundColor: selected ? '#FFFFFF' : '#4C6FFF' }]} /> : null}
              </Pressable>
            );
          })}
        </View>
        <Pressable onPress={() => setSelectedDate(today)}><Text style={styles.todayLink}>Jump to today</Text></Pressable>
      </View>

      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Plans for {formatDate(selectedDate)}</Text>
        <Text style={[styles.sectionMeta, { color: theme.mutedText }]}>{items.length} current stop{items.length === 1 ? '' : 's'} will be saved.</Text>
        <View style={styles.saveRow}>
          <TextInput
            value={planName}
            onChangeText={setPlanName}
            placeholder="Name this plan"
            placeholderTextColor="#94A3B8"
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
          />
          <Pressable style={styles.primaryButton} onPress={saveCurrentPlan}>
            <Text style={styles.primaryText}>Save plan</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.savedSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Saved plans</Text>
        {selectedPlans.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.mutedText }]}>Nothing saved for this day yet.</Text>
        ) : selectedPlans.map((plan) => (
          <View key={plan.id} style={[styles.planRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {editingId === plan.id ? (
              <View style={styles.editFields}>
                <TextInput value={editName} onChangeText={setEditName} style={[styles.input, styles.editInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} />
                <TextInput value={editDate} onChangeText={setEditDate} type="date" style={[styles.input, styles.dateInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} />
              </View>
            ) : (
              <View style={styles.planInfo}>
                <Text style={[styles.planName, { color: theme.text }]}>{plan.name}</Text>
                <Text style={[styles.planMeta, { color: theme.mutedText }]}>{formatDate(plan.date)} · {plan.items.length} stops</Text>
              </View>
            )}
            <View style={styles.planActions}>
              {editingId === plan.id ? (
                <Pressable onPress={() => finishEdit(plan.id)}><Text style={styles.actionText}>Done</Text></Pressable>
              ) : (
                <>
                  <Pressable onPress={() => { loadPlan(plan); setSelectedDate(plan.date); }}><Text style={styles.actionText}>Open</Text></Pressable>
                  <Pressable onPress={() => beginEdit(plan)}><Text style={styles.actionText}>Edit</Text></Pressable>
                </>
              )}
              <Pressable onPress={() => deletePlan(plan.id)}><Text style={styles.deleteText}>Remove</Text></Pressable>
            </View>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { maxWidth: 860, width: '100%', alignSelf: 'center' },
  eyebrow: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '700', marginBottom: 6 },
  title: { fontSize: 36, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 16, lineHeight: 24, marginBottom: 22 },
  calendarCard: { borderWidth: 1, borderRadius: 18, padding: 20, marginBottom: 18 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  monthTitle: { fontSize: 20, fontWeight: '800' },
  navButton: { paddingHorizontal: 12, paddingVertical: 4 },
  navText: { fontSize: 30, lineHeight: 32 },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekday: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.2857%', minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  selectedDay: { backgroundColor: '#4C6FFF' },
  dayText: { fontSize: 15, fontWeight: '700' },
  planDot: { width: 5, height: 5, borderRadius: 3, marginTop: 3 },
  todayLink: { color: '#4C6FFF', fontWeight: '700', textAlign: 'center', marginTop: 14 },
  section: { borderWidth: 1, borderRadius: 18, padding: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '800' },
  sectionMeta: { marginTop: 5, marginBottom: 14 },
  saveRow: { flexDirection: 'row', gap: 10 },
  input: { borderWidth: 1, borderRadius: 10, minHeight: 42, paddingHorizontal: 12, flex: 1, fontSize: 14 },
  primaryButton: { backgroundColor: '#4C6FFF', borderRadius: 10, paddingHorizontal: 18, justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontWeight: '800' },
  savedSection: { gap: 10 },
  emptyText: { marginTop: 2 },
  planRow: { borderWidth: 1, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  planInfo: { flex: 1 },
  planName: { fontSize: 16, fontWeight: '800' },
  planMeta: { fontSize: 13, marginTop: 4 },
  planActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  actionText: { color: '#4C6FFF', fontWeight: '800', fontSize: 13 },
  deleteText: { color: '#B91C1C', fontWeight: '800', fontSize: 13 },
  editFields: { flex: 1, flexDirection: 'row', gap: 8 },
  editInput: { minWidth: 120 },
  dateInput: { flex: 0, width: 145 },
});
