import React from 'react';
import { View, Text, Modal, ActivityIndicator, StyleSheet } from 'react-native';

interface LoadingModalProps {
  visible: boolean;
  message?: string;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({ visible, message = 'Hisoblanmoqda...' }) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  box: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  message: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
});
