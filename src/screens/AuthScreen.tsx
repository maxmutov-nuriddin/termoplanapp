import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Flame,
  User,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  LogIn,
  UserPlus,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../theme';

export const AuthScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { login, register, isLoading } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Xatolik', 'Email va parol kiritilishi shart.');
      return;
    }

    if (activeTab === 'register') {
      if (!name.trim()) {
        Alert.alert('Xatolik', 'Ism va familiyangizni kiriting.');
        return;
      }
      // Ro'yxatdan o'tuvchilar har doim oddiy foydalanuvchi bo'lib ro'yxatdan o'tadi
      const res = await register(name, email, password, 'user', phone);
      if (!res.success) {
        Alert.alert('Xatolik', res.error || 'Ro‘yxatdan o‘tishda xatolik yuz berdi');
      }
    } else {
      // Login paytida faqat email va parol yuboriladi.
      // Tizim (MongoDB) rolni o'zi avtomatik aniqlaydi va kerakli ekranga yo'naltiradi.
      const res = await login(email, password);
      if (!res.success) {
        Alert.alert('Xatolik', res.error || 'Kirishda xatolik yuz berdi');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + SPACING.lg, paddingBottom: insets.bottom + SPACING.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryLight]}
            style={styles.logoCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Flame color={COLORS.surface} size={30} />
          </LinearGradient>
          <Text style={styles.brandTitle}>TermoPlan</Text>
          <Text style={styles.brandSubtitle}>
            Aqlli Mavsumiy Mikroiqlim & Tyoply Pol Platformasi
          </Text>
        </View>

        {/* Tab Switcher (Kirish va Ro'yxatdan o'tish) */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'login' && styles.activeTabBtn]}
            onPress={() => setActiveTab('login')}
          >
            <LogIn size={16} color={activeTab === 'login' ? COLORS.primaryDark : COLORS.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>Kirish</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'register' && styles.activeTabBtn]}
            onPress={() => setActiveTab('register')}
          >
            <UserPlus size={16} color={activeTab === 'register' ? COLORS.primaryDark : COLORS.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'register' && styles.activeTabText]}>Ro‘yxatdan O‘tish</Text>
          </TouchableOpacity>
        </View>

        {/* Form Card */}
        <View style={styles.card}>

          {/* Registratsiya: Ism va Familiya */}
          {activeTab === 'register' && (
            <>
              <Text style={styles.inputLabel}>Ism va Familiya *</Text>
              <View style={styles.inputBox}>
                <User size={18} color={COLORS.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Masalan: Saidov Muzaffar"
                  placeholderTextColor={COLORS.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <Text style={styles.inputLabel}>Telefon Raqam (ixtiyoriy)</Text>
              <View style={styles.inputBox}>
                <Phone size={18} color={COLORS.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="+998 90 123-45-67"
                  placeholderTextColor={COLORS.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </>
          )}

          {/* Email */}
          <Text style={styles.inputLabel}>Elektron Pochta (Email) *</Text>
          <View style={styles.inputBox}>
            <Mail size={18} color={COLORS.textMuted} />
            <TextInput
              style={styles.textInput}
              placeholder="elektron.pochta@misol.uz"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password */}
          <Text style={styles.inputLabel}>Parol *</Text>
          <View style={styles.inputBox}>
            <Lock size={18} color={COLORS.textMuted} />
            <TextInput
              style={styles.textInput}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.surface} size="small" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>
                  {activeTab === 'login' ? 'Tizimga Kirish' : 'Ro‘yxatdan O‘tish'}
                </Text>
                <ArrowRight size={18} color={COLORS.surface} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.card,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.primaryDark,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 3,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: SPACING.md,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: RADIUS.sm,
  },
  activeTabBtn: {
    backgroundColor: COLORS.surface,
    ...SHADOWS.card,
  },
  tabText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 6,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    marginTop: SPACING.lg,
    ...SHADOWS.card,
  },
  submitBtnText: {
    color: COLORS.surface,
    fontSize: 14.5,
    fontWeight: '800',
  },
});
