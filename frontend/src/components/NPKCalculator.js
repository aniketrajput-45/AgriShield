import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';

const FERTILIZER_OPTIONS = [
  { name: 'Urea', n: 46, p: 0, k: 0 },
  { name: 'DAP (18-46-0)', n: 18, p: 46, k: 0 },
  { name: 'MOP (0-0-60)', n: 0, p: 0, k: 60 },
  { name: 'NPK 15-15-15', n: 15, p: 15, k: 15 },
];

export default function NPKCalculatorUI() {
  const [targets, setTargets] = useState({ n: '120', p: '60', k: '60' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    // LOCAL IMPLEMENTATION OF OVERLAP LOGIC (Mirroring Backend)
    let remainingN = parseFloat(targets.n) || 0;
    let remainingP = parseFloat(targets.p) || 0;
    let remainingK = parseFloat(targets.k) || 0;

    let schedule = [];
    
    // Algorithm: Prioritize P/K (Compound) then N (Single)
    const available = FERTILIZER_OPTIONS;
    
    // 1. Solve for P using DAP or NPK
    const pSource = available.find(f => f.p > 0);
    if (pSource && remainingP > 0) {
      let amount = (remainingP / pSource.p) * 100;
      schedule.push({ name: pSource.name, amount: amount.toFixed(1) });
      remainingN -= (amount * (pSource.n / 100));
      remainingP = 0;
      remainingK -= (amount * (pSource.k / 100));
    }

    // 2. Solve for K using MOP
    const kSource = available.find(f => f.k > 0 && f.p === 0);
    if (kSource && remainingK > 0) {
      let amount = (remainingK / kSource.k) * 100;
      schedule.push({ name: kSource.name, amount: amount.toFixed(1) });
      remainingK = 0;
    }

    // 3. Solve for remaining N using Urea
    const nSource = available.find(f => f.n > 0 && f.p === 0 && f.k === 0);
    if (nSource && remainingN > 0) {
      let amount = (remainingN / nSource.n) * 100;
      schedule.push({ name: nSource.name, amount: amount.toFixed(1) });
      remainingN = 0;
    }

    setResults({ schedule, gap: { n: remainingN, p: remainingP, k: remainingK } });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>NPK Optimizer</Text>
      <Text style={styles.subtitle}>Smart Overlap Correction Enabled</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Target N-P-K (kg/ha)</Text>
        <View style={styles.inputRow}>
          <TextInput style={styles.input} placeholder="N" keyboardType="numeric" value={targets.n} onChangeText={t => setTargets({...targets, n: t})} />
          <TextInput style={styles.input} placeholder="P" keyboardType="numeric" value={targets.p} onChangeText={t => setTargets({...targets, p: t})} />
          <TextInput style={styles.input} placeholder="K" keyboardType="numeric" value={targets.k} onChangeText={t => setTargets({...targets, k: t})} />
        </View>

        <TouchableOpacity style={styles.button} onPress={calculate}>
          <Text style={styles.buttonText}>Calculate Application</Text>
        </TouchableOpacity>
      </View>

      {results && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Application Schedule</Text>
          {results.schedule.map((item, i) => (
            <View key={i} style={styles.resRow}>
              <Text style={styles.resName}>{item.name}</Text>
              <Text style={styles.resAmount}>{item.amount} kg/ha</Text>
            </View>
          ))}
          
          <View style={styles.gapBox}>
            <Text style={styles.gapTitle}>Nutrient Gap (Unmet)</Text>
            <Text style={styles.gapText}>N: {results.gap.n.toFixed(1)} | P: {results.gap.p.toFixed(1)} | K: {results.gap.k.toFixed(1)}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F8FAF8' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1B5E20' },
  subtitle: { fontSize: 12, color: '#666', marginBottom: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 2 },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 10 },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  input: { flex: 1, backgroundColor: '#F0F4F0', padding: 12, borderRadius: 8, textAlign: 'center', fontSize: 16 },
  button: { backgroundColor: '#2E7D32', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  resultCard: { marginTop: 20, backgroundColor: '#E8F5E9', padding: 20, borderRadius: 15 },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: '#1B5E20', marginBottom: 15 },
  resRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  resName: { fontWeight: '600', color: '#333' },
  resAmount: { color: '#2E7D32', fontWeight: 'bold' },
  gapBox: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#C8E6C9' },
  gapTitle: { fontSize: 12, fontWeight: 'bold', color: '#C62828' },
  gapText: { fontSize: 14, color: '#333', marginTop: 4 }
});
