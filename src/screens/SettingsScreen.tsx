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
  User,
  Mail,
  Phone,
  Lock,
  Building2,
  ChevronLeft,
  Save,
  LogOut,
  ShieldCheck,
} from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { API_BASE_URL } from '../api/client';
import axios from 'axios';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../theme';

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, token, logout, login } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [company, setCompany] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordSection, setIsPasswordSection] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Xatolik', 'Ismni bo\u0027sh qoldirish mumkin emas');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        name: name.trim(),
        phone: phone.trim(),
        company: company.trim(),
      };

      if (isPasswordSection && newPassword.trim()) {
        if (!currentPassword.trim()) {
          Alert.alert('Xatolik', 'Hozirgi parolni kiriting');
          setIsSaving(false);
          return;
        }
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const headers: any = { 'Content-Type': 'application/json' };
      if (token && !token.startsWith('offline') && !token.startsWith('quick')) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await axios.put(`${API_BASE_URL}/auth/profile`, payload, {
        headers,
        timeout: 15000,
      });

      if (res.data?.success) {
        // Zustand store'dagi user ma'lumotini yangilash
        const updatedUser = res.data.user;
        useAuthStore.setState({
          user: {
            id: updatedUser.id || user?.id || '',
            name: updatedUser.name,
            email: updatedUser.email || user?.email || '',
            role: updatedUser.role || user?.role || 'user',
            phone: updatedUser.phone,
            token: token || undefined,
          },
        });

        setCurrentPassword('');
        setNewPassword('');
        setIsPasswordSection(false);
        Alert.alert('Muvaffaqiyat ✅', res.data.message || 'Ma\'lumotlar saqlandi');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Xatolik yuz berdi';
      Alert.alert('Xatolik', msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Chiqish',
      'Hisobingizdan chiqishni xohlaysizmi?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Chiqish',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + SPACING.sm, paddingBottom: insets.bottom + SPACING.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sozlamalar</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(user?.name || 'F')[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>{user?.name || 'Foydalanuvchi'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'email@misol.uz'}</Text>
          <View style={[styles.roleBadge, user?.role === 'support' && styles.supportBadge]}>
            {user?.role === 'support' ? (
              <ShieldCheck size={12} color="#7E22CE" />
            ) : (
              <User size={12} color={COLORS.primary} />
            )}
            <Text style={[styles.roleText, user?.role === 'support' && { color: '#7E22CE' }]}>
              {user?.role === 'support' ? 'Support Nazoratchi' : 'Foydalanuvchi'}
            </Text>
          </View>
        </View>

        {/* Edit Fields Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Shaxsiy Ma'lumotlar</Text>

          <Text style={styles.inputLabel}>Ism va Familiya</Text>
          <View style={styles.inputBox}>
            <User size={18} color={COLORS.textMuted} />
            <TextInput
              style={styles.textInput}
              placeholder="Ismingiz"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <Text style={styles.inputLabel}>Elektron Pochta</Text>
          <View style={[styles.inputBox, styles.disabledInput]}>
            <Mail size={18} color={COLORS.textMuted} />
            <Text style={styles.disabledText}>{user?.email || 'email@misol.uz'}</Text>
          </View>

          <Text style={styles.inputLabel}>Telefon Raqam</Text>
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

          <Text style={styles.inputLabel}>Kompaniya (ixtiyoriy)</Text>
          <View style={styles.inputBox}>
            <Building2 size={18} color={COLORS.textMuted} />
            <TextInput
              style={styles.textInput}
              placeholder="Kompaniya nomi"
              placeholderTextColor={COLORS.textMuted}
              value={company}
              onChangeText={setCompany}
            />
          </View>
        </View>

        {/* Password Card */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setIsPasswordSection(!isPasswordSection)}
          >
            <Lock size={18} color={COLORS.textSecondary} />
            <Text style={styles.sectionTitle}>Parolni O'zgartirish</Text>
            <Text style={styles.toggleArrow}>{isPasswordSection ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {isPasswordSection && (
            <>
              <Text style={styles.inputLabel}>Hozirgi Parol</Text>
              <View style={styles.inputBox}>
                <Lock size={18} color={COLORS.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Hozirgi parolingiz"
                  placeholderTextColor={COLORS.textMuted}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                />
              </View>

              <Text style={styles.inputLabel}>Yangi Parol</Text>
              <View style={styles.inputBox}>
                <Lock size={18} color={COLORS.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Yangi parol"
                  placeholderTextColor={COLORS.textMuted}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>
            </>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={COLORS.surface} size="small" />
          ) : (
            <>
              <Save size={18} color={COLORS.surface} />
              <Text style={styles.saveBtnText}>Saqlash</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={18} color={COLORS.danger} />
          <Text style={styles.logoutText}>Hisobdan Chiqish</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryBg,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.primary,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  supportBadge: {
    backgroundColor: '#FAF5FF',
    borderColor: '#E9D5FF',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 4,
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
  disabledInput: {
    backgroundColor: COLORS.surfaceAlt,
  },
  disabledText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  passwordToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleArrow: {
    marginLeft: 'auto',
    fontSize: 12,
    color: COLORS.textMuted,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  saveBtnText: {
    color: COLORS.surface,
    fontSize: 14.5,
    fontWeight: '800',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.dangerBg,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    marginBottom: SPACING.lg,
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '700',
  },
});
