import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'
import { colors, spacing, typography, borderRadius } from '../theme'

type Props = NativeStackScreenProps<RootStackParamList, 'DeliveryInfo'>
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a0f0e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#a68a88' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a0f0e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#291d1c' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#57413f' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3f3230' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#160c0b' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#241918' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#241918' }] },
]

// Mock coordinates — Kimironko Hub (pickup) → Kiyovu Office (dropoff)
const PICKUP_COORD  = { latitude: -1.9355, longitude: 30.1043 } // Kimironko
const DROPOFF_COORD = { latitude: -1.9593, longitude: 30.0587 } // Kiyovu
const COURIER_COORD = { latitude: -1.9470, longitude: 30.0810 } // mid-route

const ROUTE_COORDS = [PICKUP_COORD, COURIER_COORD, DROPOFF_COORD]

// Region that fits both markers
const MAP_REGION = {
  latitude: -1.9474,
  longitude: 30.0815,
  latitudeDelta: 0.055,
  longitudeDelta: 0.055,
}

export function DeliveryInfoScreen({ navigation, route }: Props) {
  const { orderId, pickup, dropoff, totalDistance, eta, note, senderPhone } = route.params

  function handleAccept() {
    navigation.navigate('PickupOTP', {
      phone: senderPhone || '+250780000000',
      deliveryId: orderId,
    })
  }

  function handleDeny() {
    navigation.goBack()
  }

  async function handleCall() {
    const phone = senderPhone ?? '+250780000000'
    const url = `tel:${phone}`
    const supported = await Linking.canOpenURL(url)
    if (supported) {
      await Linking.openURL(url)
    } else {
      Alert.alert('Unable to call', `Cannot open dialer for ${phone}`)
    }
  }

  return (
    <View style={styles.container}>
      {/* ── Map + overlays wrapper ── */}
      <View style={styles.mapWrapper}>
        {/* ── Map (top half) ── */}
        <MapView
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={MAP_REGION}
          customMapStyle={darkMapStyle}
          scrollEnabled
          zoomEnabled
          pitchEnabled={false}
          rotateEnabled={false}
        >
          {/* Pickup marker */}
          <Marker coordinate={PICKUP_COORD} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.markerPickup}>
              <Ionicons name="archive-outline" size={16} color={colors.onPrimary} />
            </View>
          </Marker>

          {/* Courier marker */}
          <Marker coordinate={COURIER_COORD} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.markerCourier}>
              <Ionicons name="bicycle" size={16} color={colors.white} />
            </View>
          </Marker>

          {/* Dropoff marker */}
          <Marker coordinate={DROPOFF_COORD} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.markerDropoff}>
              <Ionicons name="flag" size={14} color={colors.onPrimary} />
            </View>
          </Marker>

          {/* Route line */}
          <Polyline
            coordinates={ROUTE_COORDS}
            strokeColor={colors.primary}
            strokeWidth={2.5}
            lineDashPattern={[6, 4]}
          />
        </MapView>

        {/* ── Top bar overlay ── */}
        <SafeAreaView style={styles.topBarOverlay} edges={['top']} pointerEvents="box-none">
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.topBarBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.topBarBtn}>
              <Ionicons name="person-circle-outline" size={26} color={colors.onSurface} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* ── Distance badge overlay ── */}
        <View style={styles.distanceBadge} pointerEvents="none">
          <Ionicons name="git-branch-outline" size={16} color={colors.onSurface} />
          <Text style={styles.distanceBadgeText}>{totalDistance} Total Distance</Text>
        </View>

        {/* ── Floating call button (over map, bottom-right) ── */}
        <TouchableOpacity style={styles.callBtn} onPress={handleCall} activeOpacity={0.85}>
          <Ionicons name="call" size={22} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>

      {/* ── Bottom sheet ── */}
      <View style={styles.sheet}>
        {/* Assignment header */}
        <View style={styles.sheetHeader}>
          <View style={styles.sheetHeaderLeft}>
            <Text style={styles.newAssignmentLabel}>NEW ASSIGNMENT</Text>
            <Text style={styles.orderId}>Order #{orderId}</Text>
          </View>
          <View style={styles.etaBadge}>
            <Ionicons name="time-outline" size={14} color={colors.onPrimary} />
            <Text style={styles.etaText}>{eta} ETA</Text>
          </View>
        </View>

        {/* Pickup / Dropoff cards */}
        <View style={styles.locationsRow}>
          <View style={styles.locationCard}>
            <View style={styles.locationIconRow}>
              <Ionicons name="location-outline" size={14} color={colors.onSurfaceVariant} />
              <Text style={styles.locationTypeLabel}>Pickup</Text>
            </View>
            <Text style={styles.locationName}>{pickup}</Text>
          </View>
          <View style={styles.locationCard}>
            <View style={styles.locationIconRow}>
              <Ionicons name="bicycle-outline" size={14} color={colors.onSurfaceVariant} />
              <Text style={styles.locationTypeLabel}>Drop-off</Text>
            </View>
            <Text style={styles.locationName}>{dropoff}</Text>
          </View>
        </View>

        {/* Note / warning banner */}
        {note ? (
          <View style={styles.noteBanner}>
            <Ionicons name="warning-outline" size={18} color={colors.error} />
            <Text style={styles.noteText}>{note}</Text>
          </View>
        ) : null}

        {/* Action buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} activeOpacity={0.85}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.onPrimary} />
            <Text style={styles.acceptBtnText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.denyBtn} onPress={handleDeny} activeOpacity={0.85}>
            <Ionicons name="close-circle-outline" size={20} color={colors.onSurfaceVariant} />
            <Text style={styles.denyBtnText}>Deny</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  mapWrapper: {
    flex: 1,
    position: 'relative',
  },

  // Map
  map: {
    flex: 1,
  },

  // Top bar (overlay on map)
  topBarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    height: 52,
  },
  topBarBtn: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    backgroundColor: colors.darkCharcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1.5,
  },

  // Distance badge (floats over map, below top bar)
  distanceBadge: {
    position: 'absolute',
    top: 120,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(26,15,14,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  distanceBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurface,
  },

  // Floating call button (over map, bottom-right)
  callBtn: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.md,
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    elevation: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },

  // Markers
  markerPickup: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryContainer,
    borderWidth: 2.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 6,
  },
  markerCourier: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.darkCharcoal,
    borderWidth: 2.5,
    borderColor: colors.onSurfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDropoff: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },

  // Bottom sheet
  sheet: {
    backgroundColor: colors.darkCharcoal,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    // lift the sheet slightly over the map
    marginTop: -24,
    borderTopWidth: 1,
    borderColor: colors.outlineVariant,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sheetHeaderLeft: {
    gap: 2,
  },
  newAssignmentLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    letterSpacing: 1.2,
  },
  orderId: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.onSurface,
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  etaText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onPrimaryContainer,
  },

  // Location cards
  locationsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  locationCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 4,
  },
  locationIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationTypeLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
  },

  // Note banner
  noteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.errorContainer + '55',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.errorContainer,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.onSurface,
  },

  // Buttons
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  acceptBtn: {
    flex: 1,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.xl,
  },
  acceptBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onPrimaryContainer,
    letterSpacing: 0.5,
  },
  denyBtn: {
    flex: 1,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'transparent',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  denyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
})
