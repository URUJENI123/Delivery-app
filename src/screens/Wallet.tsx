import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'
import { colors, spacing, borderRadius, typography } from '../theme'

type Props = NativeStackScreenProps<RootStackParamList, 'Wallet'>

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const heights = [40, 65, 35, 90, 50, 20, 15]

const transactions = [
  { id: '#DLR-4592', type: 'delivery', label: 'Order #DLR-4592', date: 'May 24 · 14:20', amount: '+2,400', positive: true, status: 'Completed', statusColor: '#4ADE80' },
  { id: '#WITHDRAW', type: 'withdraw', label: 'Bank Withdrawal', date: 'May 23 · 09:15', amount: '-15,000', positive: false, status: 'Processing', statusColor: '#FBBF24' },
  { id: '#DLR-4588', type: 'delivery', label: 'Order #DLR-4588', date: 'May 23 · 18:45', amount: '+3,150', positive: true, status: 'Completed', statusColor: '#4ADE80' },
]

export function Wallet({ navigation }: Props) {
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily')

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>WALLET</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Balance card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceSubLabel}>CURRENT BALANCE</Text>
          <Text style={styles.balanceValue}>RWF 45,800</Text>
          <View style={styles.balanceActions}>
            <TouchableOpacity
              style={styles.withdrawBtn}
              onPress={() => navigation.navigate('ConfirmWithdraw')}
            >
              <Ionicons name="wallet-outline" size={20} color={colors.white} />
              <Text style={styles.withdrawBtnText}>Withdraw</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn}>
              <Ionicons name="add" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Earnings overview */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Earnings Overview</Text>
            <View style={styles.periodToggle}>
              <TouchableOpacity
                style={[styles.periodBtn, period === 'daily' ? styles.periodBtnActive : undefined]}
                onPress={() => setPeriod('daily')}
              >
                <Text style={[styles.periodBtnText, period === 'daily' ? styles.periodBtnTextActive : undefined]}>Daily</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodBtn, period === 'weekly' ? styles.periodBtnActive : undefined]}
                onPress={() => setPeriod('weekly')}
              >
                <Text style={[styles.periodBtnText, period === 'weekly' ? styles.periodBtnTextActive : undefined]}>Weekly</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bar chart */}
          <View style={styles.chart}>
            {days.map((day, i) => (
              <View key={day} style={styles.chartCol}>
                <View style={styles.chartBarWrap}>
                  <View style={[
                    styles.chartBar,
                    { height: `${heights[i]}%` as any },
                    i === 3 ? styles.chartBarActive : undefined,
                  ]} />
                </View>
                <Text style={[styles.chartLabel, i === 3 ? styles.chartLabelActive : undefined]}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statSubLabel}>TOTAL EARNED</Text>
              <Text style={styles.statValue}>12.4k</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statSubLabel}>DELIVERIES</Text>
              <Text style={[styles.statValue, { color: colors.onSurface }]}>18</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statSubLabel}>HOURS ONLINE</Text>
              <Text style={[styles.statValue, { color: colors.onSurface }]}>6.5h</Text>
            </View>
          </View>
        </View>

        {/* Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {transactions.map((tx) => (
          <View
            key={tx.id}
            style={[styles.txCard, { borderLeftColor: tx.positive ? colors.primary : colors.outlineVariant }]}
          >
            <View style={styles.txIconWrap}>
              <Ionicons
                name={tx.type === 'delivery' ? 'bicycle-outline' : 'cash-outline'}
                size={20}
                color={tx.positive ? colors.primary : colors.onSurfaceVariant}
              />
            </View>
            <View style={styles.txContent}>
              <Text style={styles.txLabel}>{tx.label}</Text>
              <Text style={styles.txDate}>{tx.date}</Text>
            </View>
            <View style={styles.txRight}>
              <Text style={[styles.txAmount, { color: tx.positive ? colors.primary : colors.onSurface }]}>
                {tx.amount}
              </Text>
              <Text style={[styles.txStatus, { color: tx.statusColor }]}>{tx.status}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  topBar: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.primary, letterSpacing: 1 },

  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 40 },

  balanceCard: {
    backgroundColor: 'rgba(41,29,28,0.6)', borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: 'rgba(87,65,63,0.5)',
    padding: spacing.lg, gap: spacing.md,
  },
  balanceSubLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 2, color: colors.onSurfaceVariant, textTransform: 'uppercase' },
  balanceValue: { fontSize: 32, fontWeight: '700', color: colors.white },
  balanceActions: { flexDirection: 'row', gap: spacing.sm },
  withdrawBtn: { flex: 1, height: 48, backgroundColor: colors.primaryContainer, borderRadius: borderRadius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  withdrawBtnText: { fontSize: 14, fontWeight: '600', color: colors.white },
  addBtn: { width: 48, height: 48, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.outlineVariant, alignItems: 'center', justifyContent: 'center' },

  card: { backgroundColor: 'rgba(41,29,28,0.6)', borderRadius: borderRadius.xl, borderWidth: 1, borderColor: 'rgba(87,65,63,0.5)', padding: spacing.lg, gap: spacing.lg },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.onSurface },
  periodToggle: { flexDirection: 'row', backgroundColor: colors.surfaceContainerHigh, borderRadius: borderRadius.full, padding: 3 },
  periodBtn: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: borderRadius.full },
  periodBtnActive: { backgroundColor: colors.primaryContainer },
  periodBtnText: { fontSize: 11, fontWeight: '700', color: colors.onSurfaceVariant },
  periodBtnTextActive: { color: colors.onPrimaryContainer },

  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 112, gap: spacing.xs },
  chartCol: { flex: 1, alignItems: 'center', gap: 6 },
  chartBarWrap: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  chartBar: { width: '100%', backgroundColor: colors.surfaceContainerHighest, borderRadius: 3 },
  chartBarActive: { backgroundColor: colors.primaryContainer },
  chartLabel: { fontSize: 9, color: colors.onSurfaceVariant },
  chartLabelActive: { fontWeight: '700', color: colors.primary },

  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.outlineVariant, paddingTop: spacing.md },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statSubLabel: { fontSize: 9, textTransform: 'uppercase', color: colors.onSurfaceVariant, letterSpacing: 0.5 },
  statValue: { fontSize: 18, fontWeight: '600', color: colors.primary },
  statDivider: { width: 1, backgroundColor: colors.outlineVariant },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.onSurface },
  viewAll: { fontSize: 13, fontWeight: '600', color: colors.primary },

  txCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.lg, padding: spacing.md, borderLeftWidth: 4 },
  txIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(137,32,32,0.2)', alignItems: 'center', justifyContent: 'center' },
  txContent: { flex: 1, gap: 2 },
  txLabel: { fontSize: 14, color: colors.onSurface },
  txDate: { fontSize: 11, color: colors.onSurfaceVariant },
  txRight: { alignItems: 'flex-end', gap: 2 },
  txAmount: { fontSize: 16, fontWeight: '600' },
  txStatus: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
})
