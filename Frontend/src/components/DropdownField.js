import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function DropdownField({ label, values, options, onChange, multiple = false }) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectedValues = Array.isArray(values) ? values : [values];
  const displayValue = selectedValues.filter(Boolean).join(', ') || 'Select an option';
  const filteredOptions = options.filter((option) => option.toLowerCase().includes(query.trim().toLowerCase()));

  const selectOption = (option) => {
    if (multiple) {
      const nextValues = selectedValues.includes(option)
        ? selectedValues.filter((value) => value !== option)
        : [...selectedValues.filter(Boolean), option];
      onChange(nextValues);
      return;
    }

    onChange(option);
    setOpen(false);
  };

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.mutedText }]}>{label}</Text>
      <Pressable style={[styles.trigger, { borderColor: theme.border }]} onPress={() => { setQuery(''); setOpen(true); }}>
        <Text style={[styles.value, { color: theme.text }]}>{displayValue}</Text>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={[styles.menu, { backgroundColor: theme.surface }]}>
            <Text style={[styles.menuTitle, { color: theme.text }]}>{label}</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search options"
              placeholderTextColor={theme.mutedText}
              style={[styles.searchInput, { color: theme.text, borderColor: theme.border }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <ScrollView style={styles.optionsList} keyboardShouldPersistTaps="handled">
            {filteredOptions.map((option) => {
              const selected = selectedValues.includes(option);
              return (
                <Pressable key={option} style={[styles.option, { borderBottomColor: theme.border }]} onPress={() => selectOption(option)}>
                  <Text style={[styles.optionText, { color: theme.mutedText }, selected && styles.selectedText]}>{option}</Text>
                  {selected ? <Text style={styles.check}>✓</Text> : null}
                </Pressable>
              );
            })}
            </ScrollView>
            {multiple ? <Pressable style={styles.doneButton} onPress={() => setOpen(false)}><Text style={styles.doneText}>Done</Text></Pressable> : null}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 12 },
  label: { color: '#334155', fontSize: 14, fontWeight: '700', marginBottom: 6 },
  trigger: { minHeight: 46, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  value: { color: '#152033', fontSize: 15, flex: 1 },
  chevron: { color: '#3557D8', fontSize: 20, marginLeft: 8 },
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'center', padding: 24 },
  menu: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18 },
  menuTitle: { color: '#152033', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  searchInput: { height: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 15, marginBottom: 10 },
  optionsList: { maxHeight: 360 },
  option: { minHeight: 46, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionText: { color: '#334155', fontSize: 15 },
  selectedText: { color: '#3557D8', fontWeight: '700' },
  check: { color: '#3557D8', fontWeight: '800' },
  doneButton: { backgroundColor: '#4C6FFF', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  doneText: { color: '#FFFFFF', fontWeight: '700' },
});