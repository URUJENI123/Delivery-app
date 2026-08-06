import { useState } from 'react'
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing, typography, borderRadius } from '../theme'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'

type Props = NativeStackScreenProps<RootStackParamList, 'CourierOnboardingStep2'>

export function CourierOnboardingStep2({ navigation }: Props) {
  const [nationalId, setNationalId] = useState('')
  const [plateNumber, setPlateNumber] = useState('')
  const [momoNumber, setMomoNumber] = useState('')
  const [jacketNumber, setJacketNumber] = useState('')

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.logoPlaceholder} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={styles.stepLabel}>Step 2 of 3</Text>
            <Text style={styles.verificationLabel}>Verification</Text>
          </View>
          <View style={styles.progressSegments}>
            <View style={[styles.progressSegment, styles.progressSegmentActive]} />
            <View style={[styles.progressSegment, styles.progressSegmentActive]} />
            <View style={[styles.progressSegment, styles.progressSegmentInactive]} />
          </View>
        </View>

        <View style={styles.headerSection}>
          <Text style={styles.title}>Credentials</Text>
          <Text style={styles.subtitle}>
            We need your vehicle and payment details to activate your account.
          </Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>NATIONAL ID NUMBER</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="id-card" size={20} color={colors.outline} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="1 1990 8 0012345 0 99" placeholderTextColor={colors.outline} value={nationalId} onChangeText={setNationalId} />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>MOTORCYCLE PLATE NUMBER</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="car" size={20} color={colors.outline} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="RA 000 A" placeholderTextColor={colors.outline} value={plateNumber} onChangeText={setPlateNumber} />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>MOMO NUMBER (FOR PAYOUTS)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="wallet" size={20} color={colors.outline} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="078 XXX XXXX" placeholderTextColor={colors.outline} value={momoNumber} onChangeText={setMomoNumber} keyboardType="phone-pad" />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>JACKET NUMBER</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="shirt" size={20} color={colors.outline} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="e.g. JKT-001" placeholderTextColor={colors.outline} value={jacketNumber} onChangeText={setJacketNumber} />
            </View>
          </View>
        </View>

        <View style={styles.helperCard}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={styles.helperText}>
            Ensure your names match the registered Mobile Money account to avoid payout delays.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={() => navigation.navigate('CourierOnboardingStep3')}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, paddingHorizontal: spacing.sm },
  backButton: { position: 'absolute', left: spacing.sm, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  logoPlaceholder: { width: 40, height: 40 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl + spacing.lg, gap: spacing.xl },
  progressSection: { gap: spacing.md },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepLabel: { ...typography.labelMd, color: colors.onSurfaceVariant },
  verificationLabel: { ...typography.labelMd, color: colors.primary },
  progressSegments: { flexDirection: 'row', gap: spacing.sm },
  progressSegment: { flex: 1, height: 4, borderRadius: borderRadius.full },
  progressSegmentActive: { backgroundColor: colors.primary },
  progressSegmentInactive: { backgroundColor: colors.outlineVariant },
  headerSection: { gap: spacing.sm },
  title: { ...typography.headlineMd, color: colors.onBackground },
  subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  formSection: { gap: spacing.lg },
  fieldGroup: { gap: spacing.sm },
  fieldLabel: { ...typography.labelMd, color: colors.onSurfaceVariant, textTransform: 'uppercase' },
  inputWrapper: { position: 'relative', justifyContent: 'center' },
  inputIcon: { position: 'absolute', left: spacing.md, zIndex: 1 },
  input: { height: 48, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: borderRadius.lg, paddingLeft: spacing.xxl, paddingRight: spacing.md, color: colors.onSurface, fontSize: 14 },
  helperCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: spacing.md, backgroundColor: colors.surfaceContainerLow, borderWidth: 1, borderColor: 'rgba(87,65,63,0.3)', borderRadius: borderRadius.xl },
  helperText: { ...typography.labelSm, color: colors.onSurfaceVariant, flex: 1 },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: Platform.OS === 'ios' ? 36 : spacing.lg, borderTopWidth: 1, borderTopColor: 'rgba(87,65,63,0.1)', backgroundColor: colors.background },
  nextButton: { width: '100%', height: 48, backgroundColor: colors.primaryContainer, borderRadius: borderRadius.xl, alignItems: 'center', justifyContent: 'center' },
  nextButtonText: { ...typography.headlineSm, color: colors.onPrimaryContainer, textTransform: 'uppercase' },
})
