import { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps'
import { colors, spacing, typography } from '../theme'
import type { LiveTrackingProps } from '../types'

const steps = [
  { label: 'Broadcast', active: true, current: false },
  { label: 'Assigned', active: true, current: false },
  { label: 'Picked Up', active: true, current: false },
  { label: 'In Transit', active: true, current: true },
  { label: 'Delivered', active: false, current: false },
]

const otpDigits = ['8', '5', '2', '9']

// Mock courier contact — replace with real data from delivery context
const COURIER_PHONE = '+250780000000'
const COURIER_NAME = 'Jean-Claude'

// Coordinates — Kacyiru (pickup) → Kiyovu (dropoff)
const PICKUP_COORD  = { latitude: -1.9355, longitude: 30.0619 }
const DROPOFF_COORD = { latitude: -1.9593, longitude: 30.0587 }
const COURIER_COORD = { latitude: -1.9441, longitude: 30.0619 }

const ROUTE_COORDS = [PICKUP_COORD, COURIER_COORD, DROPOFF_COORD]

const MAP_REGION = {
  latitude: -1.9470,
  longitude: 30.0610,
  latitudeDelta: 0.045,
  longitudeDelta: 0.045,
}

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

export function LiveTracking({ navigation }: LiveTrackingProps) {
  const [translateY] = useState(() => new Animated.Value(0))
  const [expanded, setExpanded] = useState(true)
  const sheetAnim = useRef(new Animated.Value(1)).current

  function toggleSheet() {
    const toValue = expanded ? 0 : 1
    Animated.timing(sheetAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start()
    setExpanded(!expanded)
  }

  async function handleCall() {
    const url = `tel:${COURIER_PHONE}`
    const supported = await Linking.canOpenURL(url)
    if (supported) {
      await Linking.openURL(url)
    } else {
      Alert.alert('Unable to call', `Cannot open dialer for ${COURIER_PHONE}`)
    }
  }

  function handleMessage() {
    navigation.navigate('Chat', {
      id: 'delivery-KE-9928102',
      name: COURIER_NAME,
      orderTag: '#KE-9928102',
    })
  }

  useEffect(() => {
    let mounted = true
    const animate = () => {
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -6,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (mounted) animate()
      })
    }
    animate()
    return () => { mounted = false }
  }, [])

  return (
    <View style={styles.container}>
      {/* Map Canvas */}
      <View style={styles.mapCanvas}>
        <MapView
          style={styles.mapView}
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
              <Ionicons name="archive-outline" size={14} color={colors.onPrimary} />
            </View>
          </Marker>

          {/* Courier (animated position) */}
          <Marker coordinate={COURIER_COORD} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.markerCourier}>
              <Ionicons name="car-sport-outline" size={16} color={colors.white} />
            </View>
          </Marker>

          {/* Dropoff marker */}
          <Marker coordinate={DROPOFF_COORD} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.markerDropoff}>
              <Ionicons name="flag" size={13} color={colors.onPrimary} />
            </View>
          </Marker>

          {/* Route line */}
          <Polyline
            coordinates={ROUTE_COORDS}
            strokeColor={colors.primary}
            strokeWidth={3}
            lineDashPattern={[6, 4]}
          />
        </MapView>

        {/* Gradient Overlay */}
        <LinearGradient
          colors={['transparent', colors.background]}
          style={styles.gradientOverlay}
          pointerEvents="none"
        />

        {/* Courier badge */}
        <View style={styles.hubMarker}>
          <View style={styles.hubDot} />
          <Text style={styles.hubLabel}>Jean-Claude is 4 mins away</Text>
        </View>

        {/* Floating Controls */}
        <View style={styles.floatingControls}>
          <TouchableOpacity style={styles.floatingBtn}>
            <Ionicons name="locate" size={22} color={colors.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.floatingBtn}>
            <Ionicons name="layers-outline" size={22} color={colors.onSurface} />
          </TouchableOpacity>
        </View>

        {/* Floating back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        {/* Drag handle — tap to fold/unfold */}
        <TouchableOpacity style={styles.dragHandleWrap} onPress={toggleSheet} activeOpacity={0.7}>
          <View style={styles.dragHandle} />
          <Ionicons
            name={expanded ? 'chevron-down' : 'chevron-up'}
            size={16}
            color={colors.onSurfaceVariant}
          />
        </TouchableOpacity>

        <Animated.View style={[
          styles.sheetContent,
          {
            maxHeight: sheetAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 600],
            }),
            opacity: sheetAnim,
            overflow: 'hidden',
          },
        ]}>
          {/* Status Header */}
          <View style={styles.statusHeader}>
            <View style={styles.statusLeft}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>IN_TRANSIT</Text>
              </View>
              <Text style={styles.etaTitle}>Arriving at 14:20</Text>
              <Text style={styles.orderInfo}>
                Order #KE-9928102 from Kacyiru
              </Text>
            </View>
            <View style={styles.statusActions}>
              <TouchableOpacity style={styles.statusActionBtn} onPress={handleCall}>
                <Ionicons name="call" size={22} color={colors.onSurface} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.statusActionBtn} onPress={handleMessage}>
                <Ionicons name="chatbubble" size={22} color={colors.onSurface} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressSection}>
            <View style={styles.progressTrackBg} />
            <View style={styles.progressActiveTrack} />
            <View style={styles.progressDots}>
              {steps.map((step, i) => (
                <View
                  key={step.label}
                  style={[
                    styles.progressDot,
                    step.current ? styles.progressDotCurrent : undefined,
                    !step.active ? styles.progressDotInactive : undefined,
                    { left: `${i * 25}%` },
                  ]}
                />
              ))}
            </View>
            <View style={styles.progressLabels}>
              {steps.map((step) => (
                <Text
                  key={step.label}
                  style={[
                    styles.progressLabel,
                    step.current ? styles.progressLabelCurrent : undefined,
                    !step.active ? styles.progressLabelInactive : undefined,
                  ]}
                >
                  {step.label}
                </Text>
              ))}
            </View>
          </View>

          {/* Courier Profile + OTP Grid */}
          <View style={styles.gridRow}>
            {/* Courier Profile Card */}
            <View style={styles.courierCard}>
              <View style={styles.courierAvatar} />
              <Text style={styles.courierName}>Jean-Claude</Text>
              <View style={styles.courierRating}>
                <Ionicons name="star" size={14} color={colors.primary} />
                <Text style={styles.courierRatingText}>
                  4.9 • Premier Courier
                </Text>
              </View>
              <Text style={styles.vehicleLabel}>Vehicle Plate</Text>
              <Text style={styles.vehiclePlate}>RAD 442 B</Text>
            </View>

            {/* OTP Section */}
            <View style={styles.otpCard}>
              <View style={styles.otpHeader}>
                <Text style={styles.otpTitle}>Recipient OTP</Text>
                <Ionicons
                  name="shield-checkmark"
                  size={16}
                  color={colors.primary}
                />
              </View>
              <View style={styles.otpDigits}>
                {otpDigits.map((digit, i) => (
                  <View key={i} style={styles.otpDigitBox}>
                    <Text style={styles.otpDigit}>{digit}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity>
                <Text style={styles.otpShareLink}>Share</Text>
              </TouchableOpacity>
              <Text style={styles.otpHint}>
                Provide this code to Jean-Claude upon arrival.
              </Text>
            </View>
          </View>

          {/* Emergency/Help Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.footerLeft}>
              <Ionicons name="warning-outline" size={18} color={colors.error} />
              <Text style={styles.footerReportText}>Report Issue</Text>
            </TouchableOpacity>
            <View style={styles.footerRight}>
              <View style={styles.gpsDot} />
              <Text style={styles.gpsText}>Live GPS Connection</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topAppBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    backgroundColor: colors.background,
  },
  topAppBarBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {},
  logoNormal: {
    ...typography.labelMd,
    color: colors.onSurface,
  },
  logoAccent: {
    ...typography.labelMd,
    color: colors.primary,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  mapCanvas: {
    flex: 1,
    position: 'relative',
  },
  mapView: {
    ...StyleSheet.absoluteFillObject,
  },
  markerPickup: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    borderWidth: 2,
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
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  markerDropoff: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  hubMarker: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(36,25,24,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  hubDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  hubLabel: {
    ...typography.labelSm,
    color: colors.onSurface,
  },
  courierMarkerContainer: {
    position: 'absolute',
    top: '42%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  courierBadge: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: 8,
  },
  courierBadgeText: {
    ...typography.labelSm,
    color: colors.onSurface,
  },
  courierMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  courierCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationMarker: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    alignItems: 'center',
  },
  locationDotOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(76,175,80,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  locationLabel: {
    ...typography.labelSm,
    color: colors.onSurface,
    marginTop: 4,
  },
  floatingControls: {
    position: 'absolute',
    top: 56,
    right: 16,
    gap: 8,
  },
  floatingBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.darkCharcoal,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  bottomSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: colors.background,
    paddingTop: 8,
  },
  dragHandleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
    gap: 4,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outlineVariant,
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusLeft: {
    gap: 4,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    ...typography.labelSm,
    color: colors.onPrimaryContainer,
    letterSpacing: 0.5,
  },
  etaTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  orderInfo: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  statusActions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSection: {
    position: 'relative',
    paddingTop: 8,
    paddingBottom: 4,
  },
  progressTrackBg: {
    width: '100%',
    height: 2,
    backgroundColor: colors.outlineVariant,
    borderRadius: 1,
    position: 'absolute',
    top: 14,
  },
  progressActiveTrack: {
    width: '75%',
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
    position: 'absolute',
    top: 14,
  },
  progressDots: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    height: 24,
  },
  progressDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginLeft: -6,
    top: 8,
  },
  progressDotCurrent: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: -12,
    top: 2,
    borderWidth: 3,
    borderColor: colors.background,
  },
  progressDotInactive: {
    backgroundColor: colors.outlineVariant,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
  },
  progressLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  progressLabelCurrent: {
    color: colors.primary,
    fontWeight: '700',
  },
  progressLabelInactive: {
    color: colors.outlineVariant,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  courierCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  courierAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceContainerHighest,
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: 4,
  },
  courierName: {
    ...typography.headlineSm,
    color: colors.onSurface,
  },
  courierRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  courierRatingText: {
    ...typography.labelSm,
    color: colors.primary,
  },
  vehicleLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  vehiclePlate: {
    ...typography.labelMd,
    color: colors.onSurface,
  },
  otpCard: {
    flex: 1,
    backgroundColor: 'rgba(137,32,32,0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,179,173,0.2)',
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  otpTitle: {
    ...typography.labelSm,
    color: colors.onSurface,
  },
  otpDigits: {
    flexDirection: 'row',
    gap: 6,
  },
  otpDigitBox: {
    width: 40,
    height: 48,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpDigit: {
    ...typography.headlineSm,
    color: colors.primary,
  },
  otpShareLink: {
    ...typography.labelSm,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  otpHint: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    paddingTop: 16,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerReportText: {
    ...typography.labelMd,
    color: colors.error,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  gpsText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
})
