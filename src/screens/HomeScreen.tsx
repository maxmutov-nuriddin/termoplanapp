import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Plus,
  Flame,
  ChevronRight,
  Building,
  MapPin,
  Trash2,
  Home,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useProjectStore } from '../store/projectStore';
import { Header } from '../components/common/Header';
import { CustomButton } from '../components/common/CustomButton';
import { IProject } from '../types';
import { UZBEKISTAN_REGIONS } from '../api/client';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../theme';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const {
    projects,
    fetchProjects,
    createProject,
    selectProject,
    deleteProject,
    isRefreshing,
  } = useProjectStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('tashkent');
  const [buildingType, setBuildingType] = useState<'private_house' | 'apartment'>('private_house');

  useEffect(() => {
    fetchProjects(false);
  }, []);

  const handleCreateProject = async (presetTitle?: string, presetType?: 'private_house' | 'apartment') => {
    const titleToUse = (presetTitle || newTitle).trim() || 'Yangi Mikroiqlim Loyihasi';

    const proj = await createProject({
      title: titleToUse,
      clientName: clientName.trim() || undefined,
      regionId: selectedRegion,
      compassNorthAngle: 0,
      buildingType: presetType || buildingType,
      wallMaterial: 'brick',
    });

    setModalVisible(false);
    setNewTitle('');
    setClientName('');
    navigation.navigate('LocationScreen', { projectId: proj._id || proj.id });
  };

  const handleOpenProject = async (project: IProject) => {
    await selectProject(project._id || project.id!);
    navigation.navigate('ConstructorScreen', { projectId: project._id || project.id });
  };

  const handleDeleteProject = (project: IProject) => {
    Alert.alert(
      'Loyihani o‘chirish',
      `"${project.title}" loyihasini rostdan ham o‘chirmoqchimisiz?`,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'O‘chirish',
          style: 'destructive',
          onPress: () => deleteProject(project._id || project.id!),
        },
      ]
    );
  };

  const renderProjectItem = ({ item }: { item: IProject }) => {
    const isCalculated = item.status === 'calculated';
    const regionName = UZBEKISTAN_REGIONS.find((r) => r.id === item.regionId)?.name || item.regionId?.toUpperCase() || 'TOSHKENT';

    return (
      <TouchableOpacity
        style={styles.projectCard}
        onPress={() => handleOpenProject(item)}
        activeOpacity={0.75}
      >
        <View style={[styles.cardAccent, { backgroundColor: isCalculated ? COLORS.success : COLORS.cool }]} />
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, isCalculated ? styles.badgeSuccess : styles.badgeDraft]}>
              <Text style={[styles.statusText, isCalculated ? styles.statusSuccessText : styles.statusDraftText]}>
                {isCalculated ? '⚡ Hisoblangan' : '📝 Qoralama'}
              </Text>
            </View>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>
                {item.buildingType === 'private_house' ? '🏡 Hovli/Kottej' : '🏢 Kvartira'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.deleteIconBtn}
            onPress={() => handleDeleteProject(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.projectTitle}>{item.title}</Text>
        {item.clientName ? <Text style={styles.clientName}>👤 Mijoz: {item.clientName}</Text> : null}

        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <MapPin size={13} color={COLORS.primary} />
            <Text style={styles.footerText}>{regionName}</Text>
          </View>
          <View style={styles.footerItem}>
            <Building size={13} color={COLORS.textSecondary} />
            <Text style={styles.footerText}>{item.totalArea || 24} m²</Text>
          </View>
          <View style={styles.openPill}>
            <Text style={styles.openPillText}>Ochish</Text>
            <ChevronRight color={COLORS.primary} size={14} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="TermoPlan"
        subtitle="Issiqlik & Mikroiqlim Muhandisi"
        rightAction={
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.newBtnGradient}
            >
              <Plus color={COLORS.surface} size={18} />
              <Text style={styles.newBtnText}>Yangi</Text>
            </LinearGradient>
          </TouchableOpacity>
        }
      />

      <FlatList
        data={projects}
        keyExtractor={(item, index) => item._id || item.id || `proj_${index}`}
        renderItem={renderProjectItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchProjects(true)}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={[COLORS.primaryBg, COLORS.surfaceAlt]}
              style={styles.emptyIconCircle}
            >
              <Flame size={36} color={COLORS.primary} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>Loyihalar yo‘q</Text>
            <Text style={styles.emptyDesc}>
              Bitta tugma orqali yangi xona yoki uyni noldan loyihalang:
            </Text>

            <CustomButton
              title="Yangi Loyiha Yaratish"
              onPress={() => setModalVisible(true)}
              style={{ marginTop: 24, width: '100%' }}
              icon={<Plus size={18} color={COLORS.surface} />}
            />
          </View>
        }
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.kavWrapper}
            >
              <View style={styles.modalCard}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalTitle}>✨ Yangi Mikroiqlim Loyihasi</Text>
                  <Text style={styles.modalSubtitle}>
                    Loyiha nomi va bino turini tanlang:
                  </Text>

                  <Text style={styles.inputLabel}>Loyiha Nomi *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Masalan: Yangi Hovli Mehmonxonasi"
                    placeholderTextColor={COLORS.textMuted}
                    value={newTitle}
                    onChangeText={setNewTitle}
                    autoFocus
                  />

                  <Text style={styles.inputLabel}>Mijoz / Obyekt (Ixtiyoriy)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Masalan: Sardor aka"
                    placeholderTextColor={COLORS.textMuted}
                    value={clientName}
                    onChangeText={setClientName}
                  />

                  <Text style={styles.inputLabel}>Bino Turi:</Text>
                  <View style={styles.typeSelectorRow}>
                    <TouchableOpacity
                      style={[styles.typeBtn, buildingType === 'private_house' && styles.typeBtnActive]}
                      onPress={() => setBuildingType('private_house')}
                    >
                      <Text style={[styles.typeBtnText, buildingType === 'private_house' && styles.typeBtnTextActive]}>
                        🏡 Hovli / Kottej
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typeBtn, buildingType === 'apartment' && styles.typeBtnActive]}
                      onPress={() => setBuildingType('apartment')}
                    >
                      <Text style={[styles.typeBtnText, buildingType === 'apartment' && styles.typeBtnTextActive]}>
                        🏢 Kvartira
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.cancelBtnText}>Bekor qilish</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.confirmBtn}
                      onPress={() => handleCreateProject()}
                    >
                      <LinearGradient
                        colors={[COLORS.primary, COLORS.primaryLight]}
                        style={styles.confirmGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={styles.confirmBtnText}>🚀 Yaratish</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  newBtn: {
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    ...SHADOWS.button,
  },
  newBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  newBtnText: {
    color: COLORS.surface,
    fontSize: 13,
    fontWeight: '800',
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  projectCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  badgeSuccess: {
    backgroundColor: COLORS.successBg,
  },
  badgeDraft: {
    backgroundColor: COLORS.borderLight,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  statusSuccessText: {
    color: COLORS.success,
  },
  statusDraftText: {
    color: COLORS.textSecondary,
  },
  typeBadge: {
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  typeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.primary,
  },
  deleteIconBtn: {
    padding: 4,
  },
  projectTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  clientName: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  openPill: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    gap: 2,
  },
  openPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: SPACING.xxl,
    marginTop: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  quickPresetsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: SPACING.sm,
  },
  presetCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  presetTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 8,
  },
  presetSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  kavWrapper: {
    width: '100%',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.floating,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    marginTop: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    marginBottom: SPACING.lg,
  },
  typeBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: COLORS.primaryBg,
    borderColor: COLORS.primary,
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  typeBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: SPACING.sm,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  confirmBtn: {
    flex: 1.5,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.button,
  },
  confirmGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.surface,
  },
});
