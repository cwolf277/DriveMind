import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

export function RecordButton({ isRecording, isProcessing, onPress, disabled }) {
  const label = isProcessing
    ? 'Processing…'
    : isRecording
    ? 'Stop recording'
    : 'Start recording';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isRecording && styles.buttonRecording,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || isProcessing}
    >
      {isProcessing ? <ActivityIndicator color="#fff" style={{ marginRight: 8 }} /> : null}
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 999,
    alignSelf: 'center',
    marginVertical: 16,
  },
  buttonRecording: { backgroundColor: '#cc2a2a' },
  buttonDisabled: { opacity: 0.5 },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
