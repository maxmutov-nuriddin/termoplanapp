import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowLeft, Share2, Info } from 'lucide-react-native';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {showBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ArrowLeft color="#0F172A" size={24} />
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
      </View>
      {rightAction ? <View style={styles.rightContainer}>{rightAction}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  rightContainer: {
    marginLeft: 12,
  },
});
