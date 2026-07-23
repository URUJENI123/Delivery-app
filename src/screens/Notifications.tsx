import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'
import { colors, spacing, borderRadius, typography } from '../theme'

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>

export function Notifications({ navigation }: Props) {
  const [orderConfirmation, setOrderConfirmation] = useState(true)
  const [outForDelivery, setOutForDelivery] = useState(true)
  const [delivered, setDelivered] = useState(true)
  const [courierLocation, setCourierLocation] = useState(true)
  const [promotions, setPromotions] = useState(false)
  const [systemUpdates, setSystemUpdates] = useState(true)

  function resetToDefault() {
    setOrderConfirmation(true)
    setOutForDelivery(true)
    setDelivered(true)
    setCourierLocation(true)
    setPromotions(false)
    setSystemUpdates(true)
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>
          Manage how you receive alerts and updates from KigaliExpress.
        </Text>

        {/* Delivery Alerts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="cube" size={14} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>DELIVERY ALERTS</Text>
          </View>

          <View style={styles.card}>
            {/* Order Confirmation */}
            <View style={styles.toggleItem}>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>Order Confirmation</Text>
                <Text style={styles.toggleDesc}>
                  Receive a ping when your order is placed successfully.
                </Text>
              </View>
              <Switch
                value={orderConfirmation}
                onValueChange={setOrderConfirmation}
                trackColor={{ false: colors.surfaceContainerHigh, true: colors.primaryContainer }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.divider} />

            {/* Out for Delivery */}
            <View style={styles.toggleItem}>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>Out for Delivery</Text>
                <Text style={styles.toggleDesc}>
                  Alerts when the courier starts moving toward you.
                </Text>
              </View>
              <Switch
                value={outForDelivery}
                onValueChange={setOutForDelivery}
                trackColor={{ false: colors.surfaceContainerHigh, true: colors.primaryContainer }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.divider} />

            {/* Delivered */}
            <View style={styles.toggleItem}>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>Delivered</Text>
                <Text style={styles.toggleDesc}>
                  Confirmation when your package has arrived safely.
                </Text>
              </View>
              <Switch
                value={delivered}
                onValueChange={setDelivered}
                trackColor={{ false: colors.surfaceContainerHigh, true: colors.primaryContainer }}
                thumbColor={colors.white}
              />
            </View>
          </View>
        </View>

        {/* Real-Time Tracking */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="location" size={14} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>REAL-TIME TRACKING</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.toggleItem}>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>Courier Live Location</Text>
                <Text style={styles.toggleDesc}>
                  Enable precise map updates as your courier moves through Kigali.
                </Text>
                {/* Map preview */}
                <View style={styles.mapPreview}>
                  <View style={styles.mapBg} />
                  <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE BEFORE ACTIVE</Text>
                  </View>
                </View>
              </View>
              <Switch
                value={courierLocation}
                onValueChange={setCourierLocation}
                trackColor={{ false: colors.surfaceContainerHigh, true: colors.primaryContainer }}
                thumbColor={colors.white}
                style={styles.toggleSwitch}
              />
            </View>
          </View>
        </View>

        {/* Account & Marketing */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="megaphone" size={14} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>ACCOUNT & MARKETING</Text>
          </View>

          <View style={styles.card}>
            {/* Promotions */}
            <View style={styles.toggleItem}>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>Promotions & Offers</Text>
                <Text style={styles.toggleDesc}>
                  New discounts, local merchant deals, and KigaliExpress rewards.
                </Text>
              </View>
              <Switch
                value={promotions}
                onValueChange={setPromotions}
                trackColor={{ false: colors.surfaceContainerHigh, true: colors.primaryContainer }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.divider} />

            {/* System Updates */}
            <View style={styles.toggleItem}>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>System Updates</Text>
                <Text style={styles.toggleDesc}>
                  Important info regarding app features and security alerts.
                </Text>
              </View>
              <Switch
                value={systemUpdates}
                onValueChange={setSystemUpdates}
                trackColor={{ false: colors.surfaceContainerHigh, true: colors.primaryContainer }}
                thumbColor={colors.white}
              />
            </View>
          </View>
        </View>

        {/* Reset button */}
        <TouchableOpacity style={styles.resetBtn} onPress={resetToDefault} activeOpacity={0.8}>
          <Text style={styles.resetBtnText}>Reset all to default</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
    gap: spacing.lg,
  },

  title: { fontSize: 28, fontWeight: '700', color: colors.onSurface },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    lineHeight: 22,
  },

  section: { gap: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  card: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.md,
    gap: spacing.md,
  },

  toggleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  toggleContent: { flex: 1, gap: spacing.xs },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
  },
  toggleDesc: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    lineHeight: 19,
  },
  toggleSwitch: {
    marginTop: 0,
    alignSelf: 'flex-start',
  },

  divider: {
    height: 1,
    backgroundColor: colors.outlineVariant + '40',
  },

  mapPreview: {
    height: 120,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: spacing.sm,
    position: 'relative',
  },
  mapBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surfaceContainerHigh,
  },
  liveIndicator: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(27,17,16,0.85)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.onSurface,
    letterSpacing: 0.5,
  },

  resetBtn: {
    height: 48,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
  },
})
