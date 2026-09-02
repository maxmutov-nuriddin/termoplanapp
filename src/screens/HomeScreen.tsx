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
  Sparkles,
  Home,
  Layers,
} from 'lucide-react-native';
import { useProjectStore } from '../store/projectStore';
import { Header } from '../components/common/Header';
import { CustomButton } from '../components/common/CustomButton';
import { IProject } from '../types';
import { UZBEKISTAN_REGIONS } from '../api/client';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const {
    projects,
    fetchProjects,
    createProject,
    selectProject,
    deleteProject,
    isLoading,
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
            <Trash2 size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <Text style={styles.projectTitle}>{item.title}</Text>
        {item.clientName ? <Text style={styles.clientName}>👤 Mijoz: {item.clientName}</Text> : null}

        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <MapPin size={13} color="#0284C7" />
            <Text style={styles.footerText}>{regionName}</Text>
          </View>
          <View style={styles.footerItem}>
            <Building size={13} color="#64748B" />
            <Text style={styles.footerText}>{item.totalArea || 24} m²</Text>
          </View>
          <View style={styles.openPill}>
            <Text style={styles.openPillText}>Ochish</Text>
            <ChevronRight color="#0284C7" size={14} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="TermoPlan AI"
        subtitle="Issiqlik, Tyoply Pol & Mikroiqlim Muhandisi"
        rightAction={
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Plus color="#FFFFFF" size={18} />
            <Text style={styles.newBtnText}>Yangi</Text>
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
            colors={['#0284C7']}
            tintColor="#0284C7"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Flame size={36} color="#0284C7" />
            </View>
            <Text style={styles.emptyTitle}>Hali loyihalar yo‘q</Text>
            <Text style={styles.emptyDesc}>
              Bitta tugma orqali yangi xonani 0 dan yoki tayyor shablon bilan loyihalang:
            </Text>

            <View style={styles.quickPresetsRow}>
              <TouchableOpacity
                style={styles.presetCard}
                onPress={() => handleCreateProject('🏡 Kottej (Zal + Yotoqxona)', 'private_house')}
                activeOpacity={0.8}
              >
                <Home size={22} color="#0284C7" />
                <Text style={styles.presetTitle}>Hovli / Kottej</Text>
                <Text style={styles.presetSub}>Katta maydon, Kotyol & Pol</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetCard}
                onPress={() => handleCreateProject('🏢 Kvartira (Mehmonxona)', 'apartment')}
                activeOpacity={0.8}
              >
                <Building size={22} color="#8B5CF6" />
                <Text style={styles.presetTitle}>Kvartira</Text>
                <Text style={styles.presetSub}>Kollektor & Radiator</Text>
              </TouchableOpacity>
            </View>

            <CustomButton
              title="+ Maxsus Yangi Loyiha"
              onPress={() => setModalVisible(true)}
              style={{ marginTop: 18, width: '100%' }}
            />
          </View>
        }
      />

      {/* Yangi loyiha yaratish modali */}
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
                    Loyiha nomi va bino turini tanlang, geolokatsiya avtomatik ulanadi:
                  </Text>

                  <Text style={styles.inputLabel}>Loyiha Nomi *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Masalan: Yangi Hovli Mehmonxonasi"
                    placeholderTextColor="#94A3B8"
                    value={newTitle}
                    onChangeText={setNewTitle}
                    autoFocus
                  />

                  <Text style={styles.inputLabel}>Mijoz / Obyekt (Ixtiyoriy)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Masalan: Sardor aka"
                    placeholderTextColor="#94A3B8"
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
                      <Text style={styles.confirmBtnText}>🚀 Yaratish & O‘tish</Text>
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
    backgroundColor: '#F8FAFC',
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4,
  },
  newBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeSuccess: {
    backgroundColor: '#DCFCE7',
  },
  badgeDraft: {
    backgroundColor: '#F1F5F9',
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  statusSuccessText: {
    color: '#15803D',
  },
  statusDraftText: {
    color: '#64748B',
  },
  typeBadge: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0284C7',
  },
  deleteIconBtn: {
    padding: 4,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
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
    color: '#475569',
  },
  openPill: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 2,
  },
  openPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  quickPresetsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 6,
  },
  presetCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  presetTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
  },
  presetSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  kavWrapper: {
    width: '100%',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#0F172A',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7',
  },
  typeBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  typeBtnTextActive: {
    color: '#0284C7',
    fontWeight: '800',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  confirmBtn: {
    flex: 1.5,
    backgroundColor: '#0284C7',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
