import { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps'
import { colors, spacing, typography, borderRadius } from '../theme'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { RootTabParamList, RootStackParamList } from '../types'

type Props = BottomTabScreenProps<RootTabParamList, 'Dashboard'>
type NavProp = NativeStackNavigationProp<RootStackParamList>

const savedLocations = [
  { label: 'Home', sublabel: 'Kacyiru', icon: 'home' as const },
  { label: 'Office', sublabel: 'Kacyiru', icon: 'briefcase' as const },
  { label: 'Gym', sublabel: 'Kimironko', icon: 'barbell' as const },
]

const packageSizes = ['Standard', 'Parcel', 'Large']

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

const recentDeliveries = [
  {
    name: 'Fresh Groceries',
    address: 'To: Kimironko Market Area',
    status: 'ARRIVING IN 5M',
    statusColor: '#4CAF50',
    icon: 'cart-outline' as const,
    arriving: true,
  },
  {
    name: 'Electronics Package',
    address: 'To: Gikondo Industrial Park',
    status: 'DELIVERED',
    statusColor: colors.onSurfaceVariant,
    icon: 'cube-outline' as const,
    date: 'Oct 24, 11:00 AM',
    arriving: false,
  },
  {
    name: 'Legal Documents',
    address: 'To: Kigali City Hall',
    status: 'DELIVERED',
    statusColor: colors.onSurfaceVariant,
    icon: 'document-text-outline' as const,
    date: 'Oct 22, 10:30 AM',
    arriving: false,
  },
]

function ShimmerBar() {
  const anim = useRef(new Animated.Value(0.3)).current
  useEffect(() => {
    let mounted = true
    const loop = () => {
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.8, duration: 1200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
      ]).start(() => { if (mounted) loop() })
    }
    loop()
    return () => { mounted = false }
  }, [anim])
  return (
    <View style={styles.progressTrack}>
      <View style={styles.progressFill}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: anim, backgroundColor: 'rgba(255,255,255,0.2)' }]} />
      </View>
    </View>
  )
}

export function SenderDashboard({}: Props) {
  const [deliveryType, setDeliveryType] = useState<'Standard' | 'Express'>('Standard')
  const [packageSize, setPackageSize] = useState('Standard')
  const navigation = useNavigation<NavProp>()

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logoImg}
          resizeMode="contain"
        />
        <TouchableOpacity style={styles.profileBtn}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/80?img=11' }}
            style={styles.profileImg}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome */}
        <View style={styles.welcomeRow}>
          <View style={styles.welcomeText}>
            <Text style={styles.greeting}>Hello, Amani!</Text>
            <Text style={styles.greetingSub}>Your packages are moving at Kigali speed.</Text>
          </View>
        </View>

        {/* Live Tracking */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>LIVE TRACKING</Text>
            <View style={styles.inTransitBadge}>
              <Text style={styles.inTransitText}>IN TRANSIT</Text>
            </View>
          </View>

          <View style={styles.trackingCard}>
            {/* Real Map */}
            <MapView
              style={styles.mapArea}
              provider={PROVIDER_DEFAULT}
              initialRegion={{
                latitude: -1.9441,
                longitude: 30.0619,
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
              customMapStyle={darkMapStyle}
              onPress={() => navigation.navigate('LiveTracking')}
            >
              {/* Courier marker */}
              <Marker
                coordinate={{ latitude: -1.9441, longitude: 30.0619 }}
                anchor={{ x: 0.5, y: 0.5 }}
                onPress={() => navigation.navigate('LiveTracking')}
              >
                <View style={styles.courierMarker}>
                  <Ionicons name="bicycle" size={16} color={colors.white} />
                </View>
              </Marker>
            </MapView>

            {/* Courier details */}
            <View style={styles.courierDetails}>
              <View style={styles.courierLeft}>
                <Image
                  source={{ uri: 'https://i.pravatar.cc/96?img=12' }}
                  style={styles.courierAvatar}
                />
                <View>
                  <Text style={styles.courierName}>Jean-Luc</Text>
                  <Text style={styles.courierId}>ID: #KX-99420</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={styles.ratingText}>4.9</Text>
                  </View>
                </View>
              </View>
              <View style={styles.courierRight}>
                <Text style={styles.etaLabel}>Estimated arrival</Text>
                <Text style={styles.etaValue}>12 mins</Text>
              </View>
            </View>

            {/* Progress */}
            <View style={styles.progressSection}>
              <View style={styles.progressLabels}>
                <Text style={styles.progressDot}>• Nyarugenge</Text>
                <Text style={styles.progressDot}>Kimironko •</Text>
              </View>
              <ShimmerBar />
            </View>
          </View>
        </View>

        {/* Fast Booking */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>FAST BOOKING</Text>
            <TouchableOpacity>
              <Text style={styles.sectionAction}>Manage Favorites</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.locationsScroll}>
            {savedLocations.map((loc) => (
              <TouchableOpacity key={loc.label} style={styles.locationChip}>
                <View style={styles.locationIconWrap}>
                  <Ionicons name={loc.icon} size={20} color={colors.primary} />
                </View>
                <Text style={styles.locationLabel}>{loc.label}</Text>
                <Text style={styles.locationSub}>{loc.sublabel}</Text>
              </TouchableOpacity>
            ))}
            {/* Add new saved location */}
            <TouchableOpacity style={styles.locationChip}>
              <View style={styles.locationAddIconWrap}>
                <Ionicons name="add" size={24} color={colors.onSurfaceVariant} />
              </View>
              <Text style={styles.locationLabel}>New Saved</Text>
              <Text style={styles.locationSub}>Add location</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Quick Send */}
        <View style={styles.quickSendCard}>
          <View style={styles.quickSendHeader}>
            <View style={styles.quickSendIconWrap}>
              <Ionicons name="flash" size={18} color={colors.primary} />
            </View>
            <Text style={styles.quickSendTitle}>Quick Send</Text>
          </View>

          {/* Standard / Express toggle */}
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, deliveryType === 'Standard' ? styles.typeBtnActive : undefined]}
              onPress={() => setDeliveryType('Standard')}
            >
              <Text style={[styles.typeBtnText, deliveryType === 'Standard' ? styles.typeBtnTextActive : undefined]}>
                Standard
              </Text>
              <Text style={styles.typeBtnSub}>Flexible, cost-{'\n'}effective delivery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, deliveryType === 'Express' ? styles.typeBtnActive : undefined]}
              onPress={() => setDeliveryType('Express')}
            >
              <Text style={[styles.typeBtnText, deliveryType === 'Express' ? styles.typeBtnTextActive : undefined]}>
                Express
              </Text>
              <Text style={styles.typeBtnSub}>Priority speed within{'\n'}2 hours</Text>
            </TouchableOpacity>
          </View>

          {/* Package size */}
          <View style={styles.packageRow}>
            <Text style={styles.packageLabel}>PACKAGE:</Text>
            {packageSizes.map((size) => (
              <TouchableOpacity
                key={size}
                style={[styles.sizeChip, packageSize === size ? styles.sizeChipActive : undefined]}
                onPress={() => setPackageSize(size)}
              >
                <Text style={[styles.sizeChipText, packageSize === size ? styles.sizeChipTextActive : undefined]}>
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Proceed button */}
          <TouchableOpacity style={styles.proceedBtn} onPress={() => navigation.navigate('SendPackage')} activeOpacity={0.85}>
            <Text style={styles.proceedBtnText}>Proceed to Booking</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>

        {/* Recent Deliveries */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>RECENT DELIVERIES</Text>
            <TouchableOpacity onPress={() => navigation.navigate('OrderHistory')}>
              <Text style={styles.sectionAction}>View History</Text>
            </TouchableOpacity>
          </View>

          {recentDeliveries.map((item, i) => (
            <TouchableOpacity key={i} style={styles.deliveryItem} activeOpacity={0.7}>
              {item.arriving && <View style={styles.arrivingBar} />}
              <View style={styles.deliveryIconWrap}>
                <Ionicons name={item.icon} size={22} color={colors.primary} />
              </View>
              <View style={styles.deliveryContent}>
                <Text style={styles.deliveryName}>{item.name}</Text>
                <Text style={styles.deliveryAddress}>{item.address}</Text>
                {item.arriving && <View style={styles.arrivingProgressTrack}><View style={styles.arrivingProgressFill} /></View>}
              </View>
              <View style={styles.deliveryRight}>
                <Text style={[styles.deliveryStatus, { color: item.statusColor }]}>
                  {item.status}
                </Text>
                {item.date && <Text style={styles.deliveryDate}>{item.date}</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Top bar
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: {
    width: 60,
    height: 24,
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.primary,
    overflow: 'hidden',
  },
  profileImg: {
    width: 40,
    height: 40,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
    gap: spacing.lg,
  },

  // Welcome
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeText: { flex: 1, gap: 2 },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.onSurface,
  },
  greetingSub: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  walletCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  walletLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  walletValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  walletCurrency: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },

  // Section
  section: { gap: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    letterSpacing: 1,
  },
  sectionAction: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },

  // Live tracking
  inTransitBadge: {
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  inTransitText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
  trackingCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
  },
  mapArea: {
    height: 160,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  courierMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryContainer,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  courierDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  courierLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  courierAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  courierName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
  },
  courierId: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  courierRight: { alignItems: 'flex-end' },
  etaLabel: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  etaValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  progressSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressDot: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    width: '65%',
    height: 6,
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },

  // Fast Booking
  locationsScroll: { marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg },
  locationChip: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    marginRight: spacing.sm,
    minWidth: 80,
  },
  locationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationAddIconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurface,
  },
  locationSub: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },

  // Quick Send
  quickSendCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.lg,
    gap: spacing.md,
  },
  quickSendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quickSendIconWrap: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickSendTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onSurface,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLow,
    gap: 4,
  },
  typeBtnActive: {
    borderColor: colors.primaryContainer,
    backgroundColor: colors.primaryContainer + '33',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  typeBtnTextActive: {
    color: colors.primary,
  },
  typeBtnSub: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
    lineHeight: 14,
  },
  packageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  packageLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  sizeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLow,
  },
  sizeChipActive: {
    borderColor: colors.primaryContainer,
    backgroundColor: colors.primaryContainer + '33',
  },
  sizeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  sizeChipTextActive: {
    color: colors.primary,
  },
  proceedBtn: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  proceedBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onPrimary,
  },

  // Recent Deliveries
  deliveryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  arrivingBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  deliveryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryContent: { flex: 1, gap: 3 },
  deliveryName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurface,
  },
  deliveryAddress: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  arrivingProgressTrack: {
    height: 3,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.full,
    marginTop: 4,
    overflow: 'hidden',
  },
  arrivingProgressFill: {
    width: '85%',
    height: 3,
    backgroundColor: '#4CAF50',
    borderRadius: borderRadius.full,
  },
  deliveryRight: { alignItems: 'flex-end', gap: 2 },
  deliveryStatus: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  deliveryDate: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
})
