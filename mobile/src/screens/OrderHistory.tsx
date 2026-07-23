import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'
import { colors, spacing, borderRadius, typography } from '../theme'

type Props = NativeStackScreenProps<RootStackParamList, 'OrderHistory'>

const activeOrders = [
  {
    id: '#KV-9021', status: 'In Progress', statusBg: colors.primaryContainer, statusColor: colors.onPrimaryContainer,
    price: '2,500 RWF', date: 'Today, 14:20',
    pickup: 'Kimironko Market', dropoff: 'Nyarutarama, KG 9 Ave',
  },
  {
    id: '#KV-8842', status: 'Assigned', statusBg: colors.secondaryContainer, statusColor: colors.onSurface,
    price: '1,800 RWF', date: 'Today, 15:05',
    pickup: 'Simba Supermarket, Town', dropoff: 'Kiyovu, KN 31 St',
  },
]

const completedOrders = [
  {
    id: '#KV-8711', status: 'Delivered', statusBg: colors.surfaceContainerHigh, statusColor: colors.onSurfaceVariant,
    price: '3,200 RWF', date: 'Yesterday, 18:45',
    pickup: 'Kacyiru', dropoff: 'Kacyiru',
  },
  {
    id: '#KV-8650', status: 'Delivered', statusBg: colors.surfaceContainerHigh, statusColor: colors.onSurfaceVariant,
    price: '1,500 RWF', date: 'Yesterday, 11:20',
    pickup: 'Remera', dropoff: 'Remera',
  },
]

export function OrderHistory({ navigation }: Props) {
  const [tab, setTab] = useState<'active' | 'done'>('active')

  const callCourier = () => {
    Linking.openURL('tel:+250788000123')
  }

  const orders = tab === 'active' ? activeOrders : completedOrders

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Track your speed.</Text>
        <Text style={styles.subtitle}>Review past deliveries and active shipments.</Text>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'active' ? styles.tabBtnActive : undefined]}
            onPress={() => setTab('active')}
          >
            <Text style={[styles.tabText, tab === 'active' ? styles.tabTextActive : undefined]}>
              Active ({activeOrders.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'done' ? styles.tabBtnActive : undefined]}
            onPress={() => setTab('done')}
          >
            <Text style={[styles.tabText, tab === 'done' ? styles.tabTextActive : undefined]}>
              Completed
            </Text>
          </TouchableOpacity>
        </View>

        {/* Orders */}
        {orders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderTop}>
              <View>
                <View style={[styles.statusBadge, { backgroundColor: order.statusBg }]}>
                  <Text style={[styles.statusText, { color: order.statusColor }]}>{order.status}</Text>
                </View>
                <Text style={styles.orderId}>{order.id}</Text>
              </View>
              <View style={styles.orderRight}>
                <Text style={styles.orderPrice}>{order.price}</Text>
                <Text style={styles.orderDate}>{order.date}</Text>
              </View>
            </View>

            <View style={styles.routeSection}>
              <View style={styles.routeRow}>
                <Ionicons name="radio-button-on" size={14} color={colors.onSurfaceVariant} />
                <View>
                  <Text style={styles.routeType}>Pickup</Text>
                  <Text style={styles.routeLocation}>{order.pickup}</Text>
                </View>
              </View>
              <View style={styles.routeRow}>
                <Ionicons name="location" size={14} color={colors.onSurfaceVariant} />
                <View>
                  <Text style={styles.routeType}>Dropoff</Text>
                  <Text style={styles.routeLocation}>{order.dropoff}</Text>
                </View>
              </View>
            </View>

            {tab === 'active' && order.status === 'In Progress' && (
              <View style={styles.orderActions}>
                <TouchableOpacity
                  style={styles.resumeBtn}
                  onPress={() => navigation.navigate('LiveTracking')}
                >
                  <Ionicons name="navigate" size={16} color={colors.onPrimary} />
                  <Text style={styles.resumeBtnText}>Resume Route</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.callBtn} onPress={callCourier}>
                  <Ionicons name="call" size={20} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
            )}

            {tab === 'done' && (
              <View style={styles.deliveredRow}>
                <Ionicons name="checkmark-done" size={15} color={colors.onSurfaceVariant} />
                <Text style={styles.deliveredText}>Delivered to {order.dropoff}</Text>
              </View>
            )}
          </View>
        ))}

        {/* Promo card for active tab */}
        {tab === 'active' && (
          <View style={styles.promoCard}>
            <View>
              <Text style={styles.promoTitle}>Peak Hour!</Text>
              <Text style={styles.promoDesc}>Earnings 1.5x in Gikondo for next 2hrs.</Text>
            </View>
            <View style={styles.promoIcon}>
              <Ionicons name="trending-up" size={32} color={colors.primaryContainer} />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  topBar: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.primary },

  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '600', color: colors.onSurface },
  subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, opacity: 0.8 },

  tabs: { flexDirection: 'row', backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.outlineVariant, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: borderRadius.lg, alignItems: 'center' },
  tabBtnActive: { backgroundColor: colors.primaryContainer },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.onSurfaceVariant },
  tabTextActive: { color: colors.onPrimaryContainer },

  orderCard: { backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.outlineVariant, padding: spacing.md, gap: spacing.md },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full, marginBottom: 4 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  orderId: { fontSize: 18, fontWeight: '600', color: colors.onSurface },
  orderRight: { alignItems: 'flex-end', gap: 2 },
  orderPrice: { fontSize: 13, fontWeight: '700', color: colors.primary },
  orderDate: { fontSize: 11, color: colors.onSurfaceVariant },

  routeSection: { gap: spacing.sm },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  routeType: { fontSize: 10, color: colors.onSurfaceVariant, textTransform: 'uppercase' },
  routeLocation: { fontSize: 15, color: colors.onSurface },

  orderActions: { flexDirection: 'row', gap: spacing.sm },
  resumeBtn: { flex: 1, height: 44, backgroundColor: colors.primary, borderRadius: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  resumeBtnText: { fontSize: 13, fontWeight: '600', color: colors.onPrimary },
  callBtn: { width: 44, height: 44, borderRadius: 4, borderWidth: 1, borderColor: colors.outlineVariant, alignItems: 'center', justifyContent: 'center' },

  deliveredRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deliveredText: { fontSize: 12, color: colors.onSurfaceVariant },

  promoCard: { backgroundColor: colors.primaryContainer, borderRadius: borderRadius.xl, padding: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  promoTitle: { fontSize: 16, fontWeight: '600', color: colors.onPrimaryContainer, marginBottom: 4 },
  promoDesc: { fontSize: 12, color: 'rgba(255,156,148,0.8)' },
  promoIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.onPrimaryContainer, alignItems: 'center', justifyContent: 'center' },
})
