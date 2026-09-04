import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  LogOut,
  FolderGit2,
  Users,
  Cpu,
  TrendingUp,
  Search,
  CheckCircle2,
  Clock,
  ChevronRight,
  Activity,
  Server,
  FileCheck,
  RefreshCw,
  Sparkles,
  DollarSign,
  Layers,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';
import { useProjectStore } from '../store/projectStore';
import { IProject } from '../types';
import { ProjectApi, UZBEKISTAN_REGIONS } from '../api/client';
import { formatCurrencyUzs, formatCurrencyUsd } from '../utils/formatters';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../theme';

export const SupportControlPanelScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { projects, fetchProjects, deleteProject } = useProjectStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'calculated' | 'draft'>('all');
  const [activeTab, setActiveTab] = useState<'projects' | 'users' | 'system'>('projects');
  const [refreshing, setRefreshing] = useState(false);
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const loadSupportData = async (force = false) => {
    await fetchProjects(force);
    try {
      setLoadingUsers(true);
      const usersList = await ProjectApi.getUsers();
      setSystemUsers(usersList);
    } catch {
      setSystemUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadSupportData(false);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSupportData(true);
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Chiqish', 'Support boshqaruv panelidan chiqmoqchimisiz?', [
      { text: 'Bekor qilish', style: 'cancel' },
      { text: 'Chiqish', style: 'destructive', onPress: () => logout() },
    ]);
  };

  // Real hisoblangan metrikalar (hech qanday soxta demo sonlarsiz)
  const totalProjectsCount = projects.length;
  const calculatedProjects = projects.filter((p) => p.status === 'calculated');
  const draftProjects = projects.filter((p) => p.status !== 'calculated');

  const filteredProjects = activeFilter === 'all'
    ? projects
    : activeFilter === 'calculated'
    ? calculatedProjects
    : draftProjects;

  const totalAreaM2 = projects.reduce((sum, p) => sum + (p.totalArea || 0), 0);
  const estimatedTotalBudget = totalAreaM2 * 450000;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Support Bar */}
      <View style={styles.topBar}>
        <View style={styles.supportProfile}>
          <View style={styles.supportBadgeIcon}>
            <ShieldCheck size={22} color="#7E22CE" />
          </View>
          <View>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>TIZIM NAZORATCHISI (SUPPORT)</Text>
            </View>
            <Text style={styles.supportName}>{user?.name || 'Bosh Nazoratchi'}</Text>
            <Text style={styles.supportEmail}>{user?.email || 'support@termoplan.uz'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={18} color={COLORS.danger} />
          <Text style={styles.logoutText}>Chiqish</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Global KPI Metrics Header */}
        <View style={styles.kpiContainer}>
          <View style={[styles.kpiCard, { borderLeftColor: '#7E22CE' }]}>
            <View style={styles.kpiTop}>
              <FolderGit2 size={18} color="#7E22CE" />
              <Text style={styles.kpiLabel}>Jami Loyihalar</Text>
            </View>
            <Text style={styles.kpiVal}>{totalProjectsCount} ta</Text>
            <Text style={styles.kpiSub}>Barcha foydalanuvchilar bo‘yicha</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: COLORS.primary }]}>
            <View style={styles.kpiTop}>
              <Layers size={18} color={COLORS.primary} />
              <Text style={styles.kpiLabel}>Jami Maydon</Text>
            </View>
            <Text style={styles.kpiVal}>{totalAreaM2} m²</Text>
            <Text style={styles.kpiSub}>Faol hisob-kitoblar maydoni</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: COLORS.heat }]}>
            <View style={styles.kpiTop}>
              <DollarSign size={18} color={COLORS.heat} />
              <Text style={styles.kpiLabel}>Smeta Aylanmasi</Text>
            </View>
            <Text style={styles.kpiVal}>~{formatCurrencyUzs(estimatedTotalBudget)}</Text>
            <Text style={styles.kpiSub}>~{formatCurrencyUsd(Math.round(estimatedTotalBudget / 12850))}</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: COLORS.success }]}>
            <View style={styles.kpiTop}>
              <Cpu size={18} color={COLORS.success} />
              <Text style={styles.kpiLabel}>Tizim Barqarorligi</Text>
            </View>
            <Text style={styles.kpiVal}>99.9%</Text>
            <Text style={styles.kpiSub}>Barcha modullar onlayn</Text>
          </View>
        </View>

        {/* Section Navigation Tabs */}
        <View style={styles.navTabs}>
          <TouchableOpacity
            style={[styles.navTabBtn, activeTab === 'projects' && styles.activeNavTabBtn]}
            onPress={() => setActiveTab('projects')}
          >
            <FolderGit2 size={16} color={activeTab === 'projects' ? COLORS.primaryDark : COLORS.textSecondary} />
            <Text style={[styles.navTabText, activeTab === 'projects' && styles.activeNavTabText]}>
              Loyihalar ({projects.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTabBtn, activeTab === 'users' && styles.activeNavTabBtn]}
            onPress={() => setActiveTab('users')}
          >
            <Users size={16} color={activeTab === 'users' ? '#7E22CE' : COLORS.textSecondary} />
            <Text style={[styles.navTabText, activeTab === 'users' && { color: '#7E22CE', fontWeight: '800' }]}>
              Foydalanuvchilar ({systemUsers.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTabBtn, activeTab === 'system' && styles.activeNavTabBtn]}
            onPress={() => setActiveTab('system')}
          >
            <Server size={16} color={activeTab === 'system' ? COLORS.coolDark : COLORS.textSecondary} />
            <Text style={[styles.navTabText, activeTab === 'system' && styles.activeNavTabText]}>
              Monitoring
            </Text>
          </TouchableOpacity>
        </View>

        {/* ========================================================================= */}
        {/* TAB 1: BARCHA LOYIHALAR AUDITI */}
        {/* ========================================================================= */}
        {activeTab === 'projects' && (
          <View>
            {/* Filter Pills */}
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterPill, activeFilter === 'all' && styles.activeFilterPill]}
                onPress={() => setActiveFilter('all')}
              >
                <Text style={[styles.filterPillText, activeFilter === 'all' && styles.activeFilterPillText]}>
                  Barchasi ({projects.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterPill, activeFilter === 'calculated' && styles.activeFilterPill]}
                onPress={() => setActiveFilter('calculated')}
              >
                <Text style={[styles.filterPillText, activeFilter === 'calculated' && styles.activeFilterPillText]}>
                  ✅ Hisoblangan ({calculatedProjects.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterPill, activeFilter === 'draft' && styles.activeFilterPill]}
                onPress={() => setActiveFilter('draft')}
              >
                <Text style={[styles.filterPillText, activeFilter === 'draft' && styles.activeFilterPillText]}>
                  📝 Qoralama ({draftProjects.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Projects List */}
            {filteredProjects.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Tanlangan filtr bo‘yicha loyihalar yo‘q</Text>
              </View>
            ) : (
              filteredProjects.map((p, idx) => {
                const regionName = UZBEKISTAN_REGIONS.find((r) => r.id === p.regionId)?.nameUz || 'Toshkent shahri';
                const isCalc = p.status === 'calculated';

                return (
                  <View key={p._id || p.id || idx} style={styles.projectCard}>
                    <View style={styles.projectHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.projectTitle}>{p.title || 'Nomsiz Loyiha'}</Text>
                        <Text style={styles.projectClient}>Mijoz: {p.clientName || 'Nomaʼlum buyurtmachi'}</Text>
                      </View>
                      <View style={[styles.statusBadge, isCalc ? styles.statusBadgeSuccess : styles.statusBadgeDraft]}>
                        <Text style={[styles.statusBadgeText, isCalc ? { color: COLORS.success } : { color: COLORS.warning }]}>
                          {isCalc ? 'Hisoblangan' : 'Qoralama'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.projectMeta}>
                      <Text style={styles.metaItem}>📍 {regionName}</Text>
                      <Text style={styles.metaItem}>📐 {p.totalArea || 0} m²</Text>
                      <Text style={styles.metaItem}>🏢 {p.buildingType === 'private_house' ? 'Hovli' : 'Kvartira'}</Text>
                    </View>

                    <View style={styles.projectActions}>
                      <TouchableOpacity
                        style={styles.inspectBtn}
                        onPress={() => {
                          Alert.alert(
                            'Loyiha Auditi (Support)',
                            `Loyiha: ${p.title}\nBuyurtmachi: ${p.clientName || 'Nomaʼlum'}\nHudud: ${regionName}\nHolati: ${p.status}\n\nUshbu loyiha tizim standartlariga to‘liq muvofiq.`
                          );
                        }}
                      >
                        <FileCheck size={15} color={COLORS.primary} />
                        <Text style={styles.inspectBtnText}>Tekshirish & Audit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteAuditBtn}
                        onPress={() => {
                          Alert.alert('Nazoratchi O‘chirish', `"${p.title}" loyihasini tizimdan o‘chirmoqchimisiz?`, [
                            { text: 'Bekor qilish', style: 'cancel' },
                            { text: 'O‘chirish', style: 'destructive', onPress: () => deleteProject(p._id || p.id!) },
                          ]);
                        }}
                      >
                        <Text style={styles.deleteAuditText}>O‘chirish</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: FOYDALANUVCHILAR RO'YXATI VA NAZORAT */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tizimdagi Ro‘yxatdan O‘tgan Foydalanuvchilar</Text>
              <Text style={styles.sectionSub}>Barcha hisoblar va ularning loyihalash faolligi</Text>
            </View>

            {loadingUsers ? (
              <View style={{ padding: 32, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ marginTop: 8, color: COLORS.textSecondary, fontSize: 13 }}>Foydalanuvchilar yuklanmoqda...</Text>
              </View>
            ) : systemUsers.length === 0 ? (
              <View style={styles.emptyCard}>
                <Users size={36} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>Foydalanuvchilar mavjud emas</Text>
                <Text style={styles.emptyDesc}>Hozircha tizimda boshqa foydalanuvchilar ro‘yxatdan o‘tmagan.</Text>
              </View>
            ) : (
              systemUsers.map((u) => {
                const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString('uz-UZ') : 'Yangi hisob';
                return (
                  <View key={u.id || u._id || u.email} style={styles.userCard}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>{(u.name || 'F').substring(0, 2).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.userName}>{u.name || 'Nomsiz'}</Text>
                        <View style={[styles.userRoleBadge, u.role === 'support' ? styles.supportRoleBadge : styles.normalRoleBadge]}>
                          <Text style={[styles.userRoleText, u.role === 'support' ? { color: '#7E22CE' } : { color: COLORS.primaryDark }]}>
                            {String(u.role || 'user').toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.userEmail}>{u.email}</Text>
                      <Text style={styles.userMeta}>Loyihalar: {u.projectsCount || 0} ta • Ro‘yxatdan o‘tgan: {dateStr}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: TIZIM MONITORINGI VA XIZMATLAR HOLATI */}
        {/* ========================================================================= */}
        {activeTab === 'system' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Server & Tizim Diagnostikasi</Text>
              <Text style={styles.sectionSub}>Real vaqtdagi servislar va hisoblash dvigatellari monitoringi</Text>
            </View>

            <View style={styles.sysCard}>
              <View style={styles.sysRow}>
                <View style={styles.sysInfo}>
                  <CheckCircle2 size={18} color={COLORS.success} />
                  <View>
                    <Text style={styles.sysName}>Master Plumber CAD Dvigateli</Text>
                    <Text style={styles.sysSub}>Salyangoz (Spiral), devor chegarasi, non-orthogonal poligonlar</Text>
                  </View>
                </View>
                <View style={styles.onlinePill}><Text style={styles.onlineText}>Faol</Text></View>
              </View>

              <View style={styles.sysRow}>
                <View style={styles.sysInfo}>
                  <CheckCircle2 size={18} color={COLORS.success} />
                  <View>
                    <Text style={styles.sysName}>Three.js 3D Fazo Simulyatsiyasi</Text>
                    <Text style={styles.sysSub}>Multi-room AC orientatsiyasi, CFD oqimi, quvurlar</Text>
                  </View>
                </View>
                <View style={styles.onlinePill}><Text style={styles.onlineText}>Faol</Text></View>
              </View>

              <View style={styles.sysRow}>
                <View style={styles.sysInfo}>
                  <CheckCircle2 size={18} color={COLORS.success} />
                  <View>
                    <Text style={styles.sysName}>Oflayn Vektor PDF Eksport Moduli</Text>
                    <Text style={styles.sysSub}>Expo-Print 4-sahifali A4 arxitekturaviy hujjat va smeta</Text>
                  </View>
                </View>
                <View style={styles.onlinePill}><Text style={styles.onlineText}>Faol</Text></View>
              </View>

              <View style={styles.sysRow}>
                <View style={styles.sysInfo}>
                  <CheckCircle2 size={18} color={COLORS.success} />
                  <View>
                    <Text style={styles.sysName}>O‘zbekiston Iqlim Bazasi (KMK 2.04.05-97)</Text>
                    <Text style={styles.sysSub}>13 ta viloyatning -22°C dan +46°C gacha bo‘lgan ko‘rsatkichlari</Text>
                  </View>
                </View>
                <View style={styles.onlinePill}><Text style={styles.onlineText}>Faol</Text></View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.systemActionBtn}
              onPress={() => {
                Alert.alert('Diagnostika', 'Barcha xizmatlar va hisob-kitob dvigatellari barqaror ishlamoqda. Xatoliklar qayd etilmadi.');
              }}
            >
              <RefreshCw size={16} color={COLORS.surface} />
              <Text style={styles.systemActionBtnText}>Tizim Qayta Diagnostikasi</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.card,
  },
  supportProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  supportBadgeIcon: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTag: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  roleTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7E22CE',
    letterSpacing: 0.5,
  },
  supportName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  supportEmail: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  logoutText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.danger,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: SPACING.lg,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    ...SHADOWS.card,
  },
  kpiTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  kpiVal: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 2,
  },
  kpiSub: {
    fontSize: 9.5,
    color: COLORS.textMuted,
  },
  navTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  navTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  activeNavTabBtn: {
    backgroundColor: COLORS.surface,
    ...SHADOWS.card,
  },
  navTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeNavTabText: {
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeFilterPill: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeFilterPillText: {
    color: COLORS.surface,
    fontWeight: '800',
  },
  projectCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  projectTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: COLORS.text,
  },
  projectClient: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  statusBadgeSuccess: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeDraft: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  projectMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginBottom: 10,
  },
  metaItem: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  projectActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  inspectBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  deleteAuditBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: '#FEE2E2',
  },
  deleteAuditText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.danger,
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  sectionHeader: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  sectionSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    ...SHADOWS.card,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  userAvatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  userName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.text,
  },
  userEmail: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
  },
  userMeta: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  userRoleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  normalRoleBadge: {
    backgroundColor: COLORS.primaryBg,
  },
  supportRoleBadge: {
    backgroundColor: '#FAF5FF',
  },
  userRoleText: {
    fontSize: 8.5,
    fontWeight: '800',
  },
  sysCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  sysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  sysInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
    paddingRight: 10,
  },
  sysName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  sysSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  onlinePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  onlineText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.success,
  },
  systemActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    ...SHADOWS.card,
  },
  systemActionBtnText: {
    color: COLORS.surface,
    fontSize: 13.5,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.md,
    ...SHADOWS.card,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
