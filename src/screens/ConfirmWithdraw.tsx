import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'
import { colors, spacing, borderRadius, typography } from '../theme'

type Props = NativeStackScreenProps<RootStackParamList, 'ConfirmWithdraw'>

export function ConfirmWithdraw({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Withdrawal</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Amount */}
        <View style={styles.amountSection}>
          <Text style={styles.amountSubLabel}>AMOUNT TO WITHDRAW</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountCurrency}>RWF</Text>
            <Text style={styles.amountValue}>45,800</Text>
          </View>
        </View>

        {/* MoMo number */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>MoMo Phone Number</Text>
          <View style={styles.momoRow}>
            <Ionicons name="phone-portrait-outline" size={20} color={colors.onSurfaceVariant} style={styles.momoIcon} />
            <Text style={styles.momoValue}>+250 78* *** 123</Text>
            <View style={styles.primaryBadge}>
              <Text style={styles.primaryBadgeText}>Primary</Text>
            </View>
          </View>
        </View>

        {/* Details card */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Transaction Details</Text>
          <View style={styles.detailsDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Withdrawal Amount</Text>
            <Text style={styles.detailValue}>RWF 45,800</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Processing Fee</Text>
            <Text style={[styles.detailValue, { color: colors.error }]}>- RWF 500</Text>
          </View>
          <View style={styles.detailsDashed} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabelBold}>Total to Receive</Text>
            <Text style={styles.detailValueBold}>RWF 45,300</Text>
          </View>
        </View>

        {/* Info note */}
        <View style={styles.infoNote}>
          <Ionicons name="information-circle" size={18} color={colors.primary} />
          <Text style={styles.infoText}>
            Funds typically available instantly, up to 30 mins during peak hours.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={() => navigation.navigate('WithdrawSuccess')}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>Confirm & Withdraw</Text>
          <Ionicons name="flash" size={18} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.footerHint}>Kinetic Velocity Secure Transaction</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  topBar: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg },
  headerTitle: { fontSize: 16, fontWeight: '600', color: colors.primary },

  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 120 },

  amountSection: { alignItems: 'center', paddingVertical: spacing.xl },
  amountSubLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 2, color: colors.onSurfaceVariant, textTransform: 'uppercase', marginBottom: spacing.sm },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  amountCurrency: { fontSize: 20, fontWeight: '700', color: colors.primary },
  amountValue: { fontSize: 36, fontWeight: '700', color: colors.onSurface },

  fieldGroup: { gap: spacing.sm },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.onSurfaceVariant },
  momoRow: { height: 52, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.outlineVariant, paddingHorizontal: spacing.md, gap: spacing.sm },
  momoIcon: { marginRight: 4 },
  momoValue: { flex: 1, fontSize: 15, color: colors.onSurface },
  primaryBadge: { backgroundColor: 'transparent' },
  primaryBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },

  detailsCard: { backgroundColor: colors.surfaceContainerHigh, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.outlineVariant, padding: spacing.lg, gap: spacing.md },
  detailsTitle: { fontSize: 13, fontWeight: '600', color: colors.onSurface },
  detailsDivider: { height: 1, backgroundColor: colors.outlineVariant },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 14, color: colors.onSurfaceVariant },
  detailValue: { fontSize: 14, fontWeight: '600', color: colors.onSurface },
  detailsDashed: { height: 1, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.outlineVariant },
  detailLabelBold: { fontSize: 15, fontWeight: '600', color: colors.onSurface },
  detailValueBold: { fontSize: 15, fontWeight: '700', color: colors.primary },

  infoNote: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.surfaceContainerLow, borderLeftWidth: 4, borderLeftColor: colors.primaryContainer, padding: spacing.md, borderRadius: borderRadius.lg },
  infoText: { flex: 1, fontSize: 12, color: colors.onSurfaceVariant, lineHeight: 18 },

  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.md, gap: spacing.sm },
  confirmBtn: { height: 52, backgroundColor: colors.primaryContainer, borderRadius: borderRadius.full, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },
  footerHint: { fontSize: 11, color: colors.onSurfaceVariant, opacity: 0.6, textAlign: 'center' },
})
