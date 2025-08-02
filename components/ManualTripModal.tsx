import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Button, StyleSheet } from 'react-native';

export default function ManualTripModal({ visible, onClose, onSave }) {
  const [distance, setDistance] = useState('');
  const [fuelUsed, setFuelUsed] = useState('');
  const [cost, setCost] = useState('');
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');

  const handleSave = () => {
    onSave({
      distance: parseFloat(distance),
      fuelUsed: parseFloat(fuelUsed),
      cost: parseFloat(cost),
      startLocation: { address: startAddress, latitude: 0, longitude: 0 },
      endLocation: { address: endAddress, latitude: 0, longitude: 0 },
      isManual: true,
      startTime: new Date(),
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Manual Trip Entry</Text>
          <TextInput placeholder="Distance (km)" keyboardType="numeric" value={distance} onChangeText={setDistance} style={styles.input} />
          <TextInput placeholder="Fuel Used (L)" keyboardType="numeric" value={fuelUsed} onChangeText={setFuelUsed} style={styles.input} />
          <TextInput placeholder="Cost (E)" keyboardType="numeric" value={cost} onChangeText={setCost} style={styles.input} />
          <TextInput placeholder="Start Address" value={startAddress} onChangeText={setStartAddress} style={styles.input} />
          <TextInput placeholder="End Address" value={endAddress} onChangeText={setEndAddress} style={styles.input} />
          <View style={styles.buttonRow}>
            <Button title="Cancel" onPress={onClose} />
            <Button title="Save" onPress={handleSave} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  container: { backgroundColor: '#fff', padding: 20, borderRadius: 10, width: 300 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, marginBottom: 10, padding: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
});