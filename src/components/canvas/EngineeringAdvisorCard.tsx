import { useShallow } from 'zustand/react/shallow';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ShieldCheck, Flame, Snowflake, Droplets, Layers, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Info } from 'lucide-react-native';
import { useCanvasStore, WALL_MATERIALS } from '../../store/canvasStore';

export const EngineeringAdvisorCard: React.FC = () => {
  const { roomType, roomName, wallMaterialId, wallThicknessM, boilerPosition, manifoldPosition } = useCanvasStore(useShallow(s => ({
      roomType: s.roomType,
      roomName: s.roomName,
      wallMaterialId: s.wallMaterialId,
      wallThicknessM: s.wallThicknessM,
      boilerPosition: s.boilerPosition,
      manifoldPosition: s.manifoldPosition,
    })));

  const [expandedSection, setExpandedSection] = useState<string | null>('pipes_safety');

  const currentMat = WALL_MATERIALS.find((m) => m.id === wallMaterialId) || WALL_MATERIALS[0];

  const toggleSection = (sec: string) => {
    setExpandedSection(expandedSection === sec ? null : sec);
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <ShieldCheck size={20} color="#16A34A" />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>🧠 Muhandislik & Xavfsizlik Tavsiyalari</Text>
          <Text style={styles.cardSubtitle}>KMK 2.04.05-97 va xalqaro HVAC standartlari asosida</Text>
        </View>
      </View>

      {/* 1. Suv trubalari xavfsizligi (Shtroba vs Tyoply pol) */}
      <View style={styles.sectionItem}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('pipes_safety')}
          activeOpacity={0.7}
        >
          <View style={styles.secHeaderLeft}>
            <Droplets size={16} color="#0284C7" />
            <Text style={styles.secTitle}>🚰 Suv Quvurlarini Devor Shtrobasidan O‘tkazish</Text>
          </View>
          {expandedSection === 'pipes_safety' ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
        </TouchableOpacity>

        {expandedSection === 'pipes_safety' && (
          <View style={styles.sectionContent}>
            <View style={styles.alertBox}>
              <AlertTriangle size={15} color="#D97706" />
              <Text style={styles.alertText}>
                Muhim qoida: Sovuq suv (XVS) quvurini pol ostida tyoply pol bilan birga olib o‘tish qatʼiyan taqiqlanadi!
              </Text>
            </View>
            <Text style={styles.contentText}>
              • <Text style={styles.bold}>Sababi:</Text> Tyoply pol (+45°C) sovuq suv quvurini (+10°C) isitib yuboradi, natijada ichimlik suvida xavfli bakteriyalar ko‘payadi va pol tagida kondensat namligi hosil bo‘ladi.
            </Text>
            <Text style={styles.contentText}>
              • <Text style={styles.bold}>Tavsiya:</Text> Ichimlik suvi (XVS va GVS) quvurlari devor ichidan (shtroba qilib, poldan 30 sm balandlikda, maxsus termo-izolyatsiyali gofra ichida) olib o‘tilishi shart.
            </Text>
          </View>
        )}
      </View>

      {/* 2. Nega aynan u yerdan Tyoply pol o'tkaziladi? */}
      <View style={styles.sectionItem}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('underfloor_layout')}
          activeOpacity={0.7}
        >
          <View style={styles.secHeaderLeft}>
            <Flame size={16} color="#EF4444" />
            <Text style={styles.secTitle}>🔥 Nega Aynan Shu Chizmada Tyoply Pol O‘tkaziladi?</Text>
          </View>
          {expandedSection === 'underfloor_layout' ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
        </TouchableOpacity>

        {expandedSection === 'underfloor_layout' && (
          <View style={styles.sectionContent}>
            <Text style={styles.contentText}>
              • <Text style={styles.bold}>Chegara zonasi (Oyna tagi & Tashqi devor):</Text> Xonaning eng katta issiqlik yo‘qotish qismi tashqi devorlar va deraza oynalari hisoblanadi.
            </Text>
            <Text style={styles.contentText}>
              • <Text style={styles.bold}>Zich qadam (15 sm):</Text> Oynalar ostida sovuq havo tushishini to‘sish uchun issiq quvurlar 15 sm zichlikda yotqiziladi.
            </Text>
            <Text style={styles.contentText}>
              • <Text style={styles.bold}>Asosiy zona (25-30 sm):</Text> Xonaning o‘rtasida pol qulay +24°C...+26°C haroratda bo‘lishi uchun kengroq qadam bilan yotqiziladi.
            </Text>
          </View>
        )}
      </View>

      {/* 3. Konditsioner joylashuvi */}
      <View style={styles.sectionItem}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('ac_placement')}
          activeOpacity={0.7}
        >
          <View style={styles.secHeaderLeft}>
            <Snowflake size={16} color="#0284C7" />
            <Text style={styles.secTitle}>❄️ Konditsionerni Qayerga Qo‘yish Kerak?</Text>
          </View>
          {expandedSection === 'ac_placement' ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
        </TouchableOpacity>

        {expandedSection === 'ac_placement' && (
          <View style={styles.sectionContent}>
            <Text style={styles.contentText}>
              • <Text style={styles.bold}>Optimal joy:</Text> Tashqi devor yoniga yoki derazaga yaqin joylashtiriladi. Freon trassasi qisqa (3 metrgacha) bo‘lishi kompressor xizmat muddatini 2 barobarga oshiradi.
            </Text>
            <Text style={styles.contentText}>
              • <Text style={styles.bold}>Salomatlik xavfsizligi:</Text> Konditsioner havosi krovat yoki divanga to‘g‘ridan-to‘g‘ri urilmasligi, balki butun xona bo‘ylab aylanma sirkulyatsiya qilishi lozim.
            </Text>
          </View>
        )}
      </View>

      {/* 4. Devor Materiali & Energiya Samaradorligi */}
      <View style={styles.sectionItem}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('wall_insulation')}
          activeOpacity={0.7}
        >
          <View style={styles.secHeaderLeft}>
            <Layers size={16} color="#8B5CF6" />
            <Text style={styles.secTitle}>🧱 Devor Qalinligi: {currentMat.name} ({wallThicknessM * 100} sm)</Text>
          </View>
          {expandedSection === 'wall_insulation' ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
        </TouchableOpacity>

        {expandedSection === 'wall_insulation' && (
          <View style={styles.sectionContent}>
            <Text style={styles.contentText}>
              • <Text style={styles.bold}>Tanlangan material:</Text> {currentMat.name} (Qalinligi: {wallThicknessM * 100} sm, λ = {currentMat.conductivity} W/m·K).
            </Text>
            <Text style={styles.contentText}>
              • <Text style={styles.bold}>Kelajakdagi energiya tejami:</Text> Devor qalinligi {wallThicknessM * 100} sm bo‘lsa, qish mavsumida gaz/elektr sarfi 35% gacha tejaladi va xona issiqligi uzoq vaqt saqlanadi.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  sectionItem: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  secHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  secTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  sectionContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 6,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 8,
    gap: 6,
    marginBottom: 4,
  },
  alertText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#92400E',
    flex: 1,
  },
  contentText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  bold: {
    fontWeight: '700',
    color: '#0F172A',
  },
});
