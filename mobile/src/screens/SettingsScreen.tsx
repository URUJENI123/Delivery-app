'use client'

import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Linking,
  Modal,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { colors, spacing, borderRadius, typography } from '../theme'
import type { RootStackParamList } from '../types'

type NavProp = NativeStackNavigationProp<RootStackParamList>

// ─── Section row types ────────────────────────────────────────────────────────

type RowBase = { label: string; sublabel?: string }
type RowChevron = RowBase & { type: 'chevron'; onPress: () => void; valueLabel?: string; danger?: boolean }
type RowToggle = RowBase & { type: 'toggle'; key: string }
type RowInfo = RowBase & { type: 'info'; value: string }
type RowSelect = RowBase & { type: 'select'; value: string; onPress?: () => void }
type Row = RowChevron | RowToggle | RowInfo | RowSelect

type Section = { id: string; title: string; icon: string; rows: Row[] }

const LANGUAGES = [
  { code: 'en', label: 'English',     flag: '🇬🇧' },
  { code: 'fr', label: 'French',      flag: '🇫🇷' },
  { code: 'rw', label: 'Kinyarwanda', flag: '🇷🇼' },
]

export function SettingsScreen() {
  const navigation = useNavigation<NavProp>()
  const [langModalVisible, setLangModalVisible] = useState(false)
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0])

  const [toggles, setToggles] = useState<Record<string, boolean>>({
    twoFactor: false,
    darkMode: true,
    hapticFeedback: true,
    dataSharing: false,
    incognitoTracking: false,
  })

  const flip = (key: string) =>
    setToggles(prev => ({ ...prev, [key]: !prev[key] }))

  const sections: Section[] = [
    {
      id: 'security',
      title: 'Account Security',
      icon: 'shield-outline',
      rows: [
        {
          type: 'chevron',
          label: 'Change Password',
          sublabel: 'Last updated 3 months ago',
          onPress: () => {},
        },
        {
          type: 'chevron',
          label: 'Two-Factor Authentication',
          sublabel: 'HIGHLY RECOMMENDED',
          valueLabel: toggles.twoFactor ? 'on' : 'off',
          onPress: () => flip('twoFactor'),
        },
        {
          type: 'chevron',
          label: 'Trusted Devices',
          sublabel: '3 devices currently active',
          onPress: () => {},
        },
      ],
    },
    {
      id: 'preferences',
      title: 'App Preferences',
      icon: 'options-outline',
      rows: [
        {
          type: 'select',
          label: 'Language',
          value: `${selectedLang.flag}  ${selectedLang.label}`,
          onPress: () => setLangModalVisible(true),
        },
        {
          type: 'toggle',
          label: 'Dark Mode',
          key: 'darkMode',
        },
        {
          type: 'toggle',
          label: 'Haptic Feedback',
          sublabel: 'Physical response on interaction',
          key: 'hapticFeedback',
        },
      ],
    },
    {
      id: 'privacy',
      title: 'Privacy',
      icon: 'eye-outline',
      rows: [
        {
          type: 'chevron',
          label: 'Data Sharing',
          sublabel: 'Manage how we use your usage patterns',
          onPress: () => {},
        },
        {
          type: 'toggle',
          label: 'Incognito Tracking',
          sublabel: 'Hide your location from other users',
          key: 'incognitoTracking',
        },
      ],
    },
    {
      id: 'legal',
      title: 'Legal',
      icon: 'information-circle-outline',
      rows: [
        {
          type: 'chevron',
          label: 'Terms of Service',
          onPress: () => Linking.openURL('https://example.com/terms'),
        },
        {
          type: 'chevron',
          label: 'Privacy Policy',
          onPress: () => Linking.openURL('https://example.com/privacy'),
        },
        {
          type: 'info',
          label: 'App Version',
          value: 'v2.4.1-kinetic',
        },
      ],
    },
  ]

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Language picker modal */}
      <Modal
        visible={langModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setLangModalVisible(false)}
        >
          <View style={styles.langModal}>
            <Text style={styles.langModalTitle}>Select Language</Text>
            <View style={styles.langDivider} />
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langOption,
                  selectedLang.code === lang.code ? styles.langOptionActive : undefined,
                ]}
                onPress={() => {
                  setSelectedLang(lang)
                  setLangModalVisible(false)
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <Text style={[
                  styles.langLabel,
                  selectedLang.code === lang.code ? styles.langLabelActive : undefined,
                ]}>
                  {lang.label}
                </Text>
                {selectedLang.code === lang.code && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} style={styles.langCheck} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <Ionicons name="settings-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Settings</Text>
        </View>

        {/* Sections */}
        {sections.map(section => (
          <View key={section.id} style={styles.section}>
            {/* Section header */}
            <View style={styles.sectionHeader}>
              <Ionicons name={section.icon as any} size={14} color={colors.onSurfaceVariant} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>

            {/* Rows */}
            <View style={styles.card}>
              {section.rows.map((row, i) => {
                const isLast = i === section.rows.length - 1
                return (
                  <View key={row.label}>
                    <SettingRow
                      row={row}
                      checked={row.type === 'toggle' ? toggles[row.key] : false}
                      onToggle={row.type === 'toggle' ? () => flip(row.key) : undefined}
                    />
                    {!isLast && <View style={styles.rowDivider} />}
                  </View>
                )
              })}
            </View>
          </View>
        ))}

        {/* Premium Banner */}
        <View style={styles.premiumBanner}>
          <View style={styles.premiumContent}>
            <View style={styles.premiumLogoWrap}>
              <Ionicons name="flash" size={32} color={colors.primary} />
            </View>
            <View style={styles.premiumTextWrap}>
              <Text style={styles.premiumTitle}>Kigali Premium</Text>
              <Text style={styles.premiumDesc}>Unlock unlimited express priority deliveries.</Text>
              <TouchableOpacity style={styles.upgradeBtn}>
                <Text style={styles.upgradeBtnText}>Upgrade Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.onSurface} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>LOGISTICS SYSTEM</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Row component ────────────────────────────────────────────────────────────

function SettingRow({
  row,
  checked,
  onToggle,
}: {
  row: Row
  checked: boolean
  onToggle?: () => void
}) {
  const content = (
    <View style={styles.rowInner}>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, row.type === 'chevron' && (row as RowChevron).danger ? styles.rowLabelDanger : null]}>
          {row.label}
        </Text>
        {row.sublabel ? (
          <Text style={[
            styles.rowSublabel,
            row.sublabel === 'HIGHLY RECOMMENDED' && styles.rowSublabelHighlighted,
          ]}>
            {row.sublabel}
          </Text>
        ) : null}
      </View>

      {row.type === 'toggle' && (
        <Switch
          value={checked}
          onValueChange={onToggle}
          trackColor={{ false: colors.surfaceContainerHighest, true: colors.primaryContainer }}
          thumbColor={checked ? colors.primary : colors.outline}
          ios_backgroundColor={colors.surfaceContainerHighest}
        />
      )}

      {row.type === 'chevron' && (
        <View style={styles.rowRight}>
          {(row as RowChevron).valueLabel && (
            <Text style={styles.rowValueLabel}>{(row as RowChevron).valueLabel}</Text>
          )}
          <Ionicons name="chevron-forward" size={16} color={colors.onSurfaceVariant} />
        </View>
      )}

      {row.type === 'select' && (
        <View style={styles.selectWrap}>
          <Text style={styles.selectValue}>{(row as RowSelect).value}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.onSurfaceVariant} />
        </View>
      )}
      {row.type === 'info' && (
        <Text style={styles.infoValue}>{(row as RowInfo).value}</Text>
      )}
    </View>
  )

  if (row.type === 'chevron') {
    return (
      <TouchableOpacity onPress={(row as RowChevron).onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    )
  }

  if (row.type === 'select' && (row as RowSelect).onPress) {
    return (
      <TouchableOpacity onPress={(row as RowSelect).onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    )
  }

  return <View>{content}</View>
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  topBar: {
    height: 52,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 48 },

  // Hero
  hero: { alignItems: 'center', paddingTop: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  heroTitle: { fontSize: 24, fontWeight: '700', color: colors.onSurface },
  heroSub: { fontSize: 13, color: colors.onSurfaceVariant },

  // Section
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
  },

  // Card
  card: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
  },
  rowDivider: { height: 1, backgroundColor: colors.outlineVariant, opacity: 0.4, marginLeft: spacing.md },

  // Row
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    minHeight: 52,
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 14, fontWeight: '500', color: colors.onSurface },
  rowLabelDanger: { color: colors.error },
  rowSublabel: { fontSize: 12, color: colors.onSurfaceVariant },
  rowSublabelHighlighted: { color: colors.primary, fontWeight: '600' },

  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowValueLabel: { fontSize: 13, color: colors.onSurfaceVariant },

  selectWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
  },
  selectValue: { fontSize: 13, fontWeight: '500', color: colors.onSurface },

  infoValue: { fontSize: 13, color: colors.onSurfaceVariant },

  // Premium banner
  premiumBanner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  premiumLogoWrap: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTextWrap: { flex: 1, gap: 4 },
  premiumTitle: { fontSize: 15, fontWeight: '700', color: colors.onSurface },
  premiumDesc: { fontSize: 12, color: colors.onSurfaceVariant, lineHeight: 18 },
  upgradeBtn: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.lg,
  },
  upgradeBtnText: { fontSize: 12, fontWeight: '700', color: colors.onPrimary },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    height: 52,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primaryContainer,
    marginBottom: spacing.lg,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: colors.onSurface },

  footerText: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    color: colors.onSurfaceVariant,
    opacity: 0.4,
    marginBottom: spacing.sm,
  },

  // Language modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  langModal: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
  },
  langModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onSurface,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  langDivider: { height: 1, backgroundColor: colors.outlineVariant },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant + '40',
  },
  langOptionActive: {
    backgroundColor: colors.primaryContainer + '22',
  },
  langFlag: { fontSize: 22 },
  langLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.onSurface },
  langLabelActive: { color: colors.primary, fontWeight: '700' },
  langCheck: { marginLeft: 'auto' },
})
