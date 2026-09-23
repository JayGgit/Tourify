import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { userProfile } from '../data/profile';
import DropdownField from '../components/DropdownField';
import { useTheme } from '../context/ThemeContext';

const parseList = (value) => String(value)
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

export default function ProfileScreen({ route }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const [profile, setProfile] = useState({
    ...userProfile,
    email: route.params?.email || '',
  });
  const [editingAccount, setEditingAccount] = useState(false);
  const [editingTrip, setEditingTrip] = useState(false);
  const [draft, setDraft] = useState(profile);

  const beginEditing = () => setDraft(profile);

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const saveAccount = () => {
    setProfile((current) => ({
      ...current,
      name: draft.name.trim(),
      age: Number(draft.age) || current.age,
      languages: parseList(draft.languages),
      accessibility: parseList(draft.accessibility),
    }));
    setEditingAccount(false);
  };

  const saveTrip = () => {
    setProfile((current) => ({
      ...current,
      interests: parseList(draft.interests),
      travelStyle: draft.travelStyle.trim(),
      groupSize: Number(draft.groupSize) || current.groupSize,
      transportation: parseList(draft.transportation),
    }));
    setEditingTrip(false);
  };

  const renderInput = (label, field, keyboardType = 'default') => (
    <View style={styles.editField}>
      <Text style={[styles.label, { color: theme.mutedText }]}>{label}</Text>
      <TextInput
        value={String(draft[field])}
        onChangeText={(value) => updateDraft(field, value)}
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
        keyboardType={keyboardType}
        autoCapitalize="sentences"
      />
    </View>
  );

  return (
    <ScreenContainer keyboardAware style={{ backgroundColor: theme.background }}>
      <Text style={[styles.eyebrow, { color: theme.mutedText }]}>Your profile</Text>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
        <Pressable style={styles.themeButton} onPress={toggleTheme}>
          <Text style={styles.themeButtonText}>{isDark ? 'Light mode' : 'Dark mode'}</Text>
        </Pressable>
      </View>

      <View style={[styles.heroCard, { backgroundColor: theme.elevatedSurface, borderColor: theme.border }]}>
        <Text style={[styles.heroLabel, { color: theme.mutedText }]}>Welcome back</Text>
        <Text style={[styles.heroName, { color: theme.text }]}>{profile.name}</Text>
        <Text style={[styles.heroText, { color: theme.mutedText }]}>
          Planning a comfortable, personalized trip for {profile.groupSize} travelers with a {profile.travelStyle.toLowerCase()} pace{profile.accessibility.length > 0 ? ' and accessibility needs in mind' : ''}.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Account Information</Text>
          <Pressable
            style={styles.editButton}
            onPress={() => {
              beginEditing();
              setEditingAccount((current) => !current);
            }}
          >
            <Text style={styles.editButtonText}>{editingAccount ? 'Cancel' : 'Edit'}</Text>
          </Pressable>
        </View>
        {editingAccount ? (
          <>
            {renderInput('Name', 'name')}
            {renderInput('Age', 'age', 'number-pad')}
            <DropdownField
              label="Spoken languages"
              values={draft.languages}
              options={[
                'English',
                'Spanish',
                'French',
                'Mandarin Chinese',
                'Cantonese',
                'Arabic',
                'Hindi',
                'Portuguese',
                'Bengali',
                'Russian',
                'Japanese',
                'German',
                'Korean',
                'Italian',
                'Turkish',
                'Vietnamese',
                'Persian',
                'Polish',
                'Ukrainian',
                'Dutch',
                'Greek',
                'Hebrew',
                'Swedish',
                'Norwegian',
                'Danish',
                'Finnish',
                'Czech',
                'Romanian',
                'Hungarian',
                'Thai',
                'Indonesian',
                'Malay',
                'Tagalog',
                'Swahili',
                'Other',
              ]}
              multiple
              onChange={(value) => updateDraft('languages', value)}
            />
            <DropdownField
              label="Accessibility needs"
              values={draft.accessibility}
              options={['Wheelchair accessible', 'Visual impairment', 'Hearing assistance', 'None']}
              multiple
              onChange={(value) => updateDraft('accessibility', value)}
            />
            <Pressable style={styles.saveButton} onPress={saveAccount}>
              <Text style={styles.saveButtonText}>Save account information</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={[styles.info, { color: theme.mutedText }]}><Text style={[styles.label, { color: theme.mutedText }]}>Email:</Text> {profile.email}</Text>
            <Text style={[styles.info, { color: theme.mutedText }]}><Text style={[styles.label, { color: theme.mutedText }]}>Name & Age:</Text> {profile.name}, {profile.age}</Text>
            <Text style={[styles.info, { color: theme.mutedText }]}><Text style={[styles.label, { color: theme.mutedText }]}>Spoken Languages:</Text> {profile.languages.join(', ')}</Text>
            <Text style={[styles.info, { color: theme.mutedText }]}><Text style={[styles.label, { color: theme.mutedText }]}>Accessibility Needs:</Text> {profile.accessibility.join(', ')}</Text>
          </>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Trip Information</Text>
          <Pressable
            style={styles.editButton}
            onPress={() => {
              beginEditing();
              setEditingTrip((current) => !current);
            }}
          >
            <Text style={styles.editButtonText}>{editingTrip ? 'Cancel' : 'Edit'}</Text>
          </Pressable>
        </View>
        {editingTrip ? (
          <>
            <DropdownField
              label="Interests"
              values={draft.interests}
              options={['Food', 'Nightlife', 'Hiking', 'Museums', 'Beaches', 'Shopping']}
              multiple
              onChange={(value) => updateDraft('interests', value)}
            />
            <DropdownField
              label="Travel style"
              values={draft.travelStyle}
              options={['Relaxed', 'Balanced', 'Packed']}
              onChange={(value) => updateDraft('travelStyle', value)}
            />
            {renderInput('Group size', 'groupSize', 'number-pad')}
            <DropdownField
              label="Transportation"
              values={draft.transportation}
              options={['Public Transit', 'Walking', 'Rideshare', 'Rental Car', 'Bike']}
              multiple
              onChange={(value) => updateDraft('transportation', value)}
            />
            <Pressable style={styles.saveButton} onPress={saveTrip}>
              <Text style={styles.saveButtonText}>Save trip information</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={[styles.info, { color: theme.mutedText }]}><Text style={[styles.label, { color: theme.mutedText }]}>Interests:</Text> {profile.interests.join(', ')}</Text>
            <Text style={[styles.info, { color: theme.mutedText }]}><Text style={[styles.label, { color: theme.mutedText }]}>Travel Style:</Text> {profile.travelStyle}</Text>
            <Text style={[styles.info, { color: theme.mutedText }]}><Text style={[styles.label, { color: theme.mutedText }]}>Group Size:</Text> {profile.groupSize} people</Text>
            <Text style={[styles.info, { color: theme.mutedText }]}><Text style={[styles.label, { color: theme.mutedText }]}>Transportation:</Text> {profile.transportation.join(', ')}</Text>
          </>
        )}
      </View>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeButton: {
    backgroundColor: '#152033',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 18,
  },
  themeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#EEF4FF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#DCE7FF',
  },
  heroLabel: {
    fontSize: 12,
    color: '#4C6FFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 8,
  },
  heroName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#152033',
    marginBottom: 8,
  },
  heroText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#152033',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  editButton: {
    backgroundColor: '#EEF4FF',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  editButtonText: {
    color: '#3557D8',
    fontSize: 12,
    fontWeight: '700',
  },
  editField: {
    marginBottom: 12,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#152033',
    fontSize: 15,
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: '#4C6FFF',
    borderRadius: 11,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  info: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 8,
  },
  label: {
    fontWeight: '700',
    color: '#4B5563',
  },
});
