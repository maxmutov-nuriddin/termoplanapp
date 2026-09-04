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
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  LogIn,
  UserPlus,
  Sparkles,
  Info,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore, UserRole } from '../store/authStore';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../theme';

export const AuthScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { login, register, quickLogin, isLoading } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  // Login paytida rolni aniqlash uchun tanlov (Foydalanuvchi yoki Support)
  const [loginRole, setLoginRole] = useState<UserRole>('user');

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
      // Ro'yxatdan o'tishda faqat oddiy odam (foydalanuvchi) bo'lib o'tadi
      if (!name.trim()) {
        Alert.alert('Xatolik', 'Ism va familiyangizni kiriting.');
        return;
      }
      const res = await register(name, email, password, phone);
      if (!res.success) {
        Alert.alert('Xatolik', res.error || 'Ro‘yxatdan o‘tishda xatolik yuz berdi');
      }
    } else {
      // Kirish paytida tanlangan rol bo'yicha yoki avtomatik rolda kiradi
      const res = await login(email, password, loginRole);
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
          { paddingTop: insets.top + SPACING.md, paddingBottom: insets.bottom + SPACING.xl },
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
            <Flame color={COLORS.surface} size={28} />
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
          {/* 1. LOGIN REJIMI: Qaysi rolda kirishini belgilaydi */}
          {activeTab === 'login' && (
            <View style={{ marginBottom: SPACING.md }}>
              <Text style={styles.inputLabel}>Kirish Qismi (Rol):</Text>
              <View style={styles.roleGrid}>
                <TouchableOpacity
                  style={[styles.roleCard, loginRole === 'user' && styles.activeRoleCard]}
                  onPress={() => setLoginRole('user')}
                >
                  <View style={[styles.roleIconBox, loginRole === 'user' && styles.activeRoleIconBox]}>
                    <User size={18} color={loginRole === 'user' ? COLORS.primary : COLORS.textSecondary} />
                  </View>
                  <Text style={[styles.roleTitle, loginRole === 'user' && styles.activeRoleTitle]}>
                    Foydalanuvchi
                  </Text>
                  <Text style={styles.roleDesc}>Shaxsiy loyihalar, chizmalar va smeta</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleCard, loginRole === 'support' && styles.activeSupportRoleCard]}
                  onPress={() => setLoginRole('support')}
                >
                  <View style={[styles.roleIconBox, loginRole === 'support' && styles.activeSupportRoleIconBox]}>
                    <ShieldCheck size={18} color={loginRole === 'support' ? '#7E22CE' : COLORS.textSecondary} />
                  </View>
                  <Text style={[styles.roleTitle, loginRole === 'support' && { color: '#7E22CE' }]}>
                    Support
                  </Text>
                  <Text style={styles.roleDesc}>Nazorat paneli, statistika va audit</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 2. REGISTRATSIYA REJIMI: Oddiy odam sifatida ro'yxatdan o'tadi */}
          {activeTab === 'register' && (
            <View style={styles.registerNotice}>
              <Info size={16} color={COLORS.primary} />
              <Text style={styles.registerNoticeText}>
                Foydalanuvchi hisobi: Loyihalar tuzish, 2D/3D tyoply pol chizish va smeta chiqarish imkoniyati ochiladi.
              </Text>
            </View>
          )}

          {/* Register: Ism va Familiya */}
          {activeTab === 'register' && (
            <>
              <Text style={styles.inputLabel}>Ism va Familiya *</Text>
              <View style={styles.inputBox}>
                <User size={18} color={COLORS.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Masalan: Sardor Rahimov"
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
              placeholder={activeTab === 'login' && loginRole === 'support' ? 'support@termoplan.uz' : 'muhandis@termoplan.uz'}
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
            style={[styles.submitBtn, activeTab === 'login' && loginRole === 'support' && { backgroundColor: '#7E22CE' }]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.surface} size="small" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>
                  {activeTab === 'login'
                    ? loginRole === 'support'
                      ? 'Support Boshqaruviga Kirish'
                      : 'Foydalanuvchi Sifatida Kirish'
                    : 'Foydalanuvchi Bo‘lib Ro‘yxatdan O‘tish'}
                </Text>
                <ArrowRight size={18} color={COLORS.surface} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick 1-Tap Demo Logins */}
        <View style={styles.quickSection}>
          <View style={styles.quickHeader}>
            <Sparkles size={16} color={COLORS.primary} />
            <Text style={styles.quickTitle}>Tezkor Kirish (1-Bosishda Demo):</Text>
          </View>

          <View style={styles.quickBtnRow}>
            <TouchableOpacity
              style={styles.quickUserBtn}
              onPress={() => quickLogin('user')}
            >
              <User size={16} color={COLORS.primaryDark} />
              <Text style={styles.quickUserText}>👤 Foydalanuvchi</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickSupportBtn}
              onPress={() => quickLogin('support')}
            >
              <ShieldCheck size={16} color="#7E22CE" />
              <Text style={styles.quickSupportText}>🛡️ Support Nazoratchi</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: SPACING.lg,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.card,
  },
  brandTitle: {
    fontSize: 25,
    fontWeight: '900',
    color: COLORS.primaryDark,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 2,
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
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  activeTabBtn: {
    backgroundColor: COLORS.surface,
    ...SHADOWS.card,
  },
  tabText: {
    fontSize: 13,
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
  registerNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginBottom: SPACING.md,
  },
  registerNoticeText: {
    flex: 1,
    fontSize: 11.5,
    color: COLORS.primaryDark,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 4,
  },
  roleGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  roleCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 10,
    backgroundColor: COLORS.surfaceAlt,
  },
  activeRoleCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryBg,
  },
  activeSupportRoleCard: {
    borderColor: '#7E22CE',
    backgroundColor: '#FAF5FF',
  },
  roleIconBox: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  activeRoleIconBox: {
    backgroundColor: '#CCFBF1',
  },
  activeSupportRoleIconBox: {
    backgroundColor: '#F3E8FF',
  },
  roleTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 2,
  },
  activeRoleTitle: {
    color: COLORS.primaryDark,
  },
  roleDesc: {
    fontSize: 9.5,
    color: COLORS.textMuted,
    lineHeight: 13,
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
    marginTop: SPACING.md,
    ...SHADOWS.card,
  },
  submitBtnText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '800',
  },
  quickSection: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  quickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  quickTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  quickBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickUserBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryBg,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
  },
  quickUserText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  quickSupportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
  },
  quickSupportText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7E22CE',
  },
});
