import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'
import { colors, spacing, borderRadius, typography } from '../theme'

type Props = NativeStackScreenProps<RootStackParamList, 'PendingApproval'>

export function PendingApproval({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.topBar}>
        <View style={{ width: 36 }} />
        <View style={styles.topBarCenter}>
          <Ionicons name="navigate" size={14} color={colors.primaryContainer} />
          <Text style={styles.topBarTitle}>DELIVERY</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hourglass card */}
        <View style={styles.iconCard}>
          <View style={styles.checkBadge}>
            <Ionicons name="reader-outline" size={18} color={colors.primary} />
          </View>
          <Ionicons name="hourglass-outline" size={72} color={colors.primary} />
        </View>

        {/* Title + body */}
        <Text style={styles.reviewTitle}>Application Under Review</Text>
        <Text style={styles.reviewBody}>
          We're verifying your documents.{'\n'}
          This usually takes <Text style={styles.bold}>12-24 hours</Text>.{'\n'}
          We'll notify you once you're ready{'\n'}to hit the road!
        </Text>

        {/* Steps */}
        <View style={styles.stepsCard}>
          {/* Step 1 — Done */}
          <View style={styles.stepRow}>
            <View style={[styles.stepIcon, styles.stepIconDone]}>
              <Ionicons name="checkmark" size={16} color={colors.white} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Documents Uploaded</Text>
              <Text style={styles.stepSubtitle}>Completed on Oct 24, 14:20</Text>
            </View>
            <Text style={styles.stepStatusDone}>DONE</Text>
          </View>

          {/* Connector */}
          <View style={styles.connector} />

          {/* Step 2 — Active */}
          <View style={styles.stepRow}>
            <View style={[styles.stepIcon, styles.stepIconActive]}>
              <Ionicons name="card-outline" size={16} color={colors.white} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Identity Verification</Text>
              <View style={styles.progressTrack}>
                <View style={styles.progressFill} />
              </View>
            </View>
            <Text style={styles.stepStatusChecking}>CHECKING</Text>
          </View>

          {/* Connector */}
          <View style={styles.connector} />

          {/* Step 3 — Queue */}
          <View style={styles.stepRow}>
            <View style={[styles.stepIcon, styles.stepIconQueue]}>
              <Ionicons name="git-compare-outline" size={16} color={colors.onSurfaceVariant} />
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, styles.stepTitleMuted]}>Background Check</Text>
              <Text style={styles.stepSubtitle}>Starts after identity verified</Text>
            </View>
            <Text style={styles.stepStatusQueue}>QUEUE</Text>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('CourierDashboard')}
          activeOpacity={0.8}
        >
          <Ionicons name="home-outline" size={18} color={colors.onSurface} />
          <Text style={styles.homeBtnText}>Return to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.supportBtn}
          onPress={() => navigation.navigate('Support')}
          activeOpacity={0.8}
        >
          <Ionicons name="headset-outline" size={18} color={colors.onSurfaceVariant} />
          <Text style={styles.supportBtnText}>Contact Support</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom tab bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomTab} onPress={() => navigation.navigate('CourierOnboardingStep1')}>
          <Ionicons name="person-add-outline" size={22} color={colors.onSurfaceVariant} />
          <Text style={styles.bottomTabText}>Registration</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.bottomTab, styles.bottomTabActive]}>
          <Ionicons name="hourglass" size={22} color={colors.primaryContainer} />
          <Text style={styles.bottomTabTextActive}>Status</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  // Header
  topBar: {
    height: 48, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: spacing.lg,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topBarCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  topBarTitle: { fontSize: 15, fontWeight: '800', color: colors.primary, letterSpacing: 1 },

  // Content
  content: { paddingHorizontal: spacing.lg, paddingBottom: 24, gap: spacing.lg, alignItems: 'center' },

  // Icon card
  iconCard: {
    width: 160, height: 160, backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.xl, alignItems: 'center', justifyContent: 'center',
    position: 'relative', marginTop: spacing.md,
  },
  checkBadge: {
    position: 'absolute', top: 10, right: 10,
    width: 34, height: 34, borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceContainerHighest,
    borderWidth: 1, borderColor: colors.outlineVariant,
    alignItems: 'center', justifyContent: 'center',
  },

  // Text
  reviewTitle: { fontSize: 16, fontWeight: '600', color: colors.primary, textAlign: 'center' },
  reviewBody: { fontSize: 15, color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 24 },
  bold: { color: colors.onSurface, fontWeight: '700' },

  // Steps card
  stepsCard: {
    width: '100%', backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.outlineVariant,
    padding: spacing.md,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 6 },
  stepIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepIconDone: { backgroundColor: colors.primaryContainer },
  stepIconActive: { backgroundColor: colors.primaryContainer, borderWidth: 2, borderColor: colors.primary },
  stepIconQueue: { backgroundColor: colors.surfaceContainerHigh, borderWidth: 1, borderColor: colors.outlineVariant },
  stepContent: { flex: 1, gap: 4 },
  stepTitle: { fontSize: 14, fontWeight: '700', color: colors.onSurface },
  stepTitleMuted: { color: colors.onSurfaceVariant, fontWeight: '500' },
  stepSubtitle: { fontSize: 11, color: colors.onSurfaceVariant },
  progressTrack: {
    height: 3, backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.full, overflow: 'hidden',
  },
  progressFill: { width: '65%', height: 3, backgroundColor: colors.primary, borderRadius: borderRadius.full },
  stepStatusDone: { fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 0.5 },
  stepStatusChecking: { fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 0.5 },
  stepStatusQueue: { fontSize: 11, fontWeight: '700', color: colors.onSurfaceVariant, letterSpacing: 0.5, opacity: 0.5 },

  connector: {
    width: 2, height: 20, backgroundColor: colors.primaryContainer,
    marginLeft: 17, marginVertical: 0,
  },

  // Buttons
  homeBtn: {
    width: '100%', height: 52,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.outlineVariant,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  homeBtnText: { fontSize: 15, fontWeight: '600', color: colors.onSurface },
  supportBtn: {
    width: '100%', height: 52,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.outlineVariant,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  supportBtnText: { fontSize: 15, fontWeight: '600', color: colors.onSurfaceVariant },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.outlineVariant,
    backgroundColor: colors.background,
  },
  bottomTab: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.sm, gap: 4,
  },
  bottomTabActive: {},
  bottomTabText: { fontSize: 11, color: colors.onSurfaceVariant },
  bottomTabTextActive: { fontSize: 11, fontWeight: '700', color: colors.primaryContainer },
})
