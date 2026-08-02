import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'
import { colors, spacing, borderRadius, typography } from '../theme'

type Props = NativeStackScreenProps<RootStackParamList, 'WithdrawSuccess'>

const txDetails = [
  { label: 'Transaction ID', value: 'KV-8920-X9-RW', mono: true },
  { label: 'Method', value: 'MoMo Pay (Kigali)', mono: false },
  { label: 'Status', value: 'Processing', badge: true },
]

export function WithdrawSuccess({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Success icon */}
        <View style={styles.iconWrap}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={56} color={colors.white} />
          </View>
          <View style={styles.iconRing} />
        </View>

        <Text style={styles.title}>Withdrawal Successful</Text>

        {/* Amount card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountText}>
            Your request for <Text style={styles.amountBold}>RWF 45,300</Text> is being processed.
          </Text>
          <View style={styles.etaBadge}>
            <Ionicons name="time-outline" size={14} color={colors.primary} />
            <Text style={styles.etaText}>ESTIMATED ARRIVAL: WITHIN 15 MINUTES</Text>
          </View>
        </View>

        {/* Transaction details */}
        <View style={styles.detailsCard}>
          {txDetails.map((item, i) => (
            <View key={item.label}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{item.label}</Text>
                {item.badge ? (
                  <View style={styles.processingBadge}>
                    <Text style={styles.processingBadgeText}>{item.value}</Text>
                  </View>
                ) : (
                  <Text style={[styles.detailValue, item.mono ? styles.detailValueMono : undefined]}>
                    {item.value}
                  </Text>
                )}
              </View>
              {i < txDetails.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate('Wallet')}
          activeOpacity={0.85}
        >
          <Text style={styles.backBtnText}>Back to Wallet</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.downloadBtn}>
          <Text style={styles.downloadBtnText}>Download Receipt</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { alignItems: 'center', padding: spacing.lg, paddingBottom: 48, gap: spacing.lg },

  iconWrap: { marginTop: spacing.xl, alignItems: 'center', justifyContent: 'center', width: 140, height: 140 },
  iconCircle: { width: 128, height: 128, borderRadius: 64, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  iconRing: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 1, borderColor: colors.primaryContainer, opacity: 0.3 },

  title: { fontSize: 22, fontWeight: '600', color: colors.onSurface, textAlign: 'center' },

  amountCard: { width: '100%', backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: 'rgba(87,65,63,0.3)', padding: spacing.lg, gap: spacing.md, alignItems: 'center' },
  amountText: { fontSize: 15, color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22 },
  amountBold: { color: colors.onSurface, fontWeight: '700' },
  etaBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: 'rgba(137,32,32,0.1)', borderWidth: 1, borderColor: 'rgba(137,32,32,0.2)', borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: 6 },
  etaText: { fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 0.5 },

  detailsCard: { width: '100%', backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: 'rgba(87,65,63,0.3)', padding: spacing.lg },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  detailLabel: { fontSize: 12, fontWeight: '600', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 13, fontWeight: '600', color: colors.onSurface },
  detailValueMono: { fontFamily: 'monospace' },
  processingBadge: { backgroundColor: 'rgba(74,73,73,0.3)', borderWidth: 1, borderColor: 'rgba(74,73,73,0.5)', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 3 },
  processingBadgeText: { fontSize: 10, fontWeight: '700', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: 'rgba(87,65,63,0.2)' },

  backBtn: { width: '100%', height: 48, backgroundColor: colors.primaryContainer, borderRadius: borderRadius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  backBtnText: { fontSize: 14, fontWeight: '700', color: colors.onPrimary, letterSpacing: 0.5, textTransform: 'uppercase' },
  downloadBtn: { width: '100%', height: 48, alignItems: 'center', justifyContent: 'center' },
  downloadBtnText: { fontSize: 13, fontWeight: '700', color: colors.onSurfaceVariant, letterSpacing: 0.5, textTransform: 'uppercase' },
})
