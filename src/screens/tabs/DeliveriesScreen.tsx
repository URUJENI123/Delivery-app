import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { colors, spacing, typography, borderRadius } from '../../theme'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { RootTabParamList, RootStackParamList } from '../../types'

type Props = BottomTabScreenProps<RootTabParamList, 'Deliveries'>
type NavProp = NativeStackNavigationProp<RootStackParamList>
type Filter = 'All' | 'Active' | 'Completed' | 'Cancelled'

const allDeliveries = [
  { name: 'Medical Supplies',    address: 'To: King Faisal Hospital',  status: 'IN TRANSIT', date: 'Oct 28' },
  { name: 'Fashion Items',       address: 'To: Kimironko Market',       status: 'PICKED UP',  date: 'Oct 28' },
  { name: 'Electronics Package', address: 'To: Gikondo Industrial Park',status: 'DELIVERED',  date: 'Oct 24' },
  { name: 'Legal Documents',     address: 'To: Kigali City Hall',       status: 'DELIVERED',  date: 'Oct 22' },
  { name: 'Grocery Bundle',      address: 'To: Rebero Residential',     status: 'CANCELLED',  date: 'Oct 20' },
]

const ACTIVE_STATUSES   = ['IN TRANSIT', 'PICKED UP', 'ASSIGNED']
const COMPLETED_STATUSES = ['DELIVERED']
const CANCELLED_STATUSES = ['CANCELLED']

function filterDeliveries(filter: Filter) {
  switch (filter) {
    case 'Active':    return allDeliveries.filter(d => ACTIVE_STATUSES.includes(d.status))
    case 'Completed': return allDeliveries.filter(d => COMPLETED_STATUSES.includes(d.status))
    case 'Cancelled': return allDeliveries.filter(d => CANCELLED_STATUSES.includes(d.status))
    default:          return allDeliveries
  }
}

function statusColor(status: string) {
  if (ACTIVE_STATUSES.includes(status))   return colors.primary
  if (CANCELLED_STATUSES.includes(status)) return colors.error
  return colors.onSurfaceVariant
}

export function DeliveriesScreen({}: Props) {
  const navigation = useNavigation<NavProp>()
  const [activeFilter, setActiveFilter] = useState<Filter>('All')

  const filtered = filterDeliveries(activeFilter)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.logoImg}
          resizeMode="contain"
        />
        <Ionicons name="notifications-outline" size={24} color={colors.onSurfaceVariant} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Filter chips */}
        <View style={styles.filterRow}>
          {(['All', 'Active', 'Completed', 'Cancelled'] as Filter[]).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, activeFilter === filter ? styles.filterChipActive : undefined]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterText, activeFilter === filter ? styles.filterTextActive : undefined]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Delivery list */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={40} color={colors.outlineVariant} />
            <Text style={styles.emptyText}>No {activeFilter.toLowerCase()} deliveries</Text>
          </View>
        ) : (
          filtered.map((item) => (
            <TouchableOpacity key={item.name} style={styles.deliveryItem}>
              <View style={styles.itemIcon}>
                <Ionicons
                  name="cube-outline"
                  size={20}
                  color={statusColor(item.status)}
                />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemAddress}>{item.address}</Text>
              </View>
              <View style={styles.itemRight}>
                <Text style={[styles.itemStatus, { color: statusColor(item.status) }]}>
                  {item.status}
                </Text>
                <Text style={styles.itemDate}>{item.date}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Floating map button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('DeliveriesMap')}
        activeOpacity={0.85}
      >
        <Ionicons name="map" size={24} color={colors.onPrimary} />
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, height: 52,
  },
  topBarTitle: { fontSize: 16, fontWeight: '700', color: colors.onSurface },
  logoImg: { width: 80, height: 32 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: 32 },

  viewHistoryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  viewHistoryText: { fontSize: 14, fontWeight: '600', color: colors.primary },

  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  filterChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainer,
    borderWidth: 1, borderColor: colors.outlineVariant,
  },
  filterChipActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  filterText: { ...typography.labelSm, color: colors.onSurfaceVariant },
  filterTextActive: { color: colors.white },

  deliveryItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.outlineVariant + '40',
  },
  itemIcon: {
    width: 40, height: 40, borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center',
  },
  itemContent: { flex: 1, gap: 2 },
  itemName: { fontSize: 14, fontWeight: '600', color: colors.onSurface },
  itemAddress: { ...typography.labelSm, color: colors.onSurfaceVariant },
  itemRight: { alignItems: 'flex-end', gap: 2 },
  itemStatus: { fontSize: 11, fontWeight: '700' },
  itemDate: { fontSize: 11, color: colors.onSurfaceVariant },

  emptyState: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.xxl, gap: spacing.md,
  },
  emptyText: { fontSize: 14, color: colors.onSurfaceVariant },

  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
})
