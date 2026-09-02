import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const getBtnStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryBtn;
      case 'danger':
        return styles.dangerBtn;
      case 'outline':
        return styles.outlineBtn;
      default:
        return styles.primaryBtn;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.outlineBtnText;
      default:
        return styles.btnText;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.baseBtn, getBtnStyle(), disabled && styles.disabledBtn, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#0284C7' : '#FFFFFF'} size="small" />
      ) : (
        <>
          {icon ? icon : null}
          <Text style={[styles.baseText, getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: '#0284C7',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  secondaryBtn: {
    backgroundColor: '#EA580C',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  dangerBtn: {
    backgroundColor: '#DC2626',
  },
  outlineBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#0284C7',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  baseText: {
    fontSize: 15,
    fontWeight: '700',
  },
  btnText: {
    color: '#FFFFFF',
  },
  outlineBtnText: {
    color: '#0284C7',
  },
});
