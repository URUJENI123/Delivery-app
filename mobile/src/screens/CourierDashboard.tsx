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
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps'
import { colors, spacing, borderRadius, typography } from '../theme'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { RootTabParamList, RootStackParamList } from '../types'

type Props = BottomTabScreenProps<RootTabParamList, 'Dashboard'>
type NavProp = NativeStackNavigationProp<RootStackParamList>

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

const jobs = [
  {
    id: '1',
    category: 'ELECTRONICS · FRAGILE',
    categoryColor: colors.primary,
    route: 'Kacyiru → Kimironko',
    payout: '3,000',
    pickup: 'Kigali Heights',
    dropoff: 'Kimironko Market',
    distance: '4.2 km',
    duration: '25 mins',
    expiring: '5m',
    primary: true,
  },
  {
    id: '2',
    category: 'DOCUMENTS · STANDARD',
    categoryColor: colors.onSurfaceVariant,
    route: 'Nyarutarama → Center',
    payout: '2,500',
    pickup: 'MTN Centre',
    dropoff: 'Car Free Zone',
    distance: '6.1 km',
    duration: '18 mins',
    expiring: null,
    primary: false,
  },
]

export function CourierDashboard({}: Props) {
  const [isOnline, setIsOnline] = useState(false)
  const toggleAnim = useRef(new Animated.Value(0)).current
  const navigation = useNavigation<NavProp>()

  useEffect(() => {
    Animated.timing(toggleAnim, {
      toValue: isOnline ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start()
  }, [isOnline])

  const toggleLeft = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 32],
  })

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
            source={{ uri: 'https://i.pravatar.cc/80?img=15' }}
            style={styles.profileImg}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status card */}
        <View style={[styles.statusCard, isOnline ? styles.statusCardOnline : undefined]}>
          <View style={styles.statusCardTop}>
            <View>
              <Text style={styles.welcomeText}>Welcome, Olivier</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, isOnline ? styles.statusDotOnline : styles.statusDotOffline]} />
                <Text style={styles.statusLabel}>{isOnline ? 'ONLINE & ACTIVE' : 'OFFLINE'}</Text>
              </View>
            </View>
            {/* Toggle */}
            <TouchableOpacity
              style={[styles.toggleTrack, isOnline ? styles.toggleTrackOn : undefined]}
              onPress={() => setIsOnline(!isOnline)}
              activeOpacity={0.8}
            >
              <Animated.View style={[styles.toggleThumb, { left: toggleLeft }]}>
                <Ionicons name="power" size={14} color={isOnline ? colors.primaryContainer : colors.onSurfaceVariant} />
              </Animated.View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.goOnlineBtn, isOnline ? styles.goOnlineBtnActive : undefined]}
            onPress={() => setIsOnline(!isOnline)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isOnline ? 'radio' : 'radio-outline'}
              size={20}
              color={isOnline ? colors.primary : colors.onSurfaceVariant}
            />
            <Text style={[styles.goOnlineBtnText, isOnline ? styles.goOnlineBtnTextActive : undefined]}>
              {isOnline ? 'Waiting for Requests...' : 'Go Online to Start'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.statusHint}>Location-based dispatching active</Text>
        </View>

        {/* Earnings grid */}
        <View style={styles.earningsRow}>
          <View style={styles.earningCard}>
            <Text style={styles.earningLabel}>TODAY'S EARNINGS</Text>
            <View style={styles.earningValueRow}>
              <Text style={styles.earningValue}>12,400</Text>
              <Text style={styles.earningCurrency}>RWF</Text>
            </View>
            <View style={styles.earningTrend}>
              <Ionicons name="trending-up" size={14} color="#4ADE80" />
              <Text style={styles.earningTrendText}>+12% vs yesterday</Text>
            </View>
          </View>
          <View style={styles.earningCard}>
            <Text style={styles.earningLabel}>DELIVERIES</Text>
            <View style={styles.earningValueRow}>
              <Text style={styles.earningValue}>8</Text>
              <Text style={styles.earningCurrency}>Jobs</Text>
            </View>
            <View style={styles.deliveriesBar}>
              <View style={styles.deliveriesBarFill} />
            </View>
          </View>
        </View>

        {/* Available Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Jobs</Text>
            <View style={styles.viewToggle}>
              <TouchableOpacity style={styles.viewToggleActive}>
                <Text style={styles.viewToggleActiveText}>List</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.viewToggleInactive} onPress={() => navigation.navigate('JobsMap')}>
                <Text style={styles.viewToggleInactiveText}>Map</Text>
              </TouchableOpacity>
            </View>
          </View>

          {jobs.map((job) => (
            <View key={job.id} style={[styles.jobCard, !job.primary ? styles.jobCardDim : undefined]}>
              <View style={styles.jobCardInner}>
                <View style={styles.jobLeft}>
                  <View style={styles.jobIconWrap}>
                    <Ionicons
                      name={job.primary ? 'laptop-outline' : 'document-text-outline'}
                      size={20}
                      color={job.primary ? colors.primary : colors.onSurfaceVariant}
                    />
                  </View>
                  <View style={styles.jobInfo}>
                    <Text style={[styles.jobCategory, { color: job.categoryColor }]}>{job.category}</Text>
                    <Text style={styles.jobRoute}>{job.route}</Text>
                  </View>
                </View>
                <View style={styles.jobRight}>
                  <Text style={[styles.jobPayout, !job.primary ? styles.jobPayoutMuted : undefined]}>{job.payout}</Text>
                  <Text style={styles.jobPayoutCurrency}>RWF</Text>
                </View>
              </View>

              <View style={styles.jobDetails}>
                <View style={styles.jobDetailRow}>
                  <Ionicons name="radio-button-on" size={12} color={colors.primary} />
                  <Text style={styles.jobDetailText}>Pick-up: <Text style={styles.jobDetailBold}>{job.pickup}</Text></Text>
                </View>
                <View style={styles.jobDetailRow}>
                  <Ionicons name="location" size={12} color={colors.error} />
                  <Text style={styles.jobDetailText}>Drop-off: <Text style={styles.jobDetailBold}>{job.dropoff}</Text></Text>
                </View>
              </View>

              <View style={styles.jobMeta}>
                <View style={styles.jobMetaItem}>
                  <Ionicons name="map-outline" size={14} color={colors.onSurfaceVariant} />
                  <Text style={styles.jobMetaText}>{job.distance}</Text>
                </View>
                <View style={styles.jobMetaItem}>
                  <Ionicons name="time-outline" size={14} color={colors.onSurfaceVariant} />
                  <Text style={styles.jobMetaText}>{job.duration}</Text>
                </View>
                {job.expiring && (
                  <View style={styles.jobMetaItem}>
                    <Ionicons name="information-circle-outline" size={14} color={colors.onSurfaceVariant} />
                    <Text style={styles.jobExpiringText}>Expiring {job.expiring}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.acceptBtn, !job.primary ? styles.acceptBtnSecondary : undefined]}
                onPress={() =>
                  navigation.navigate('DeliveryInfo', {
                    orderId: `KV-${440 + Number(job.id)}`,
                    pickup: job.pickup,
                    dropoff: job.dropoff,
                    totalDistance: job.distance,
                    eta: job.duration,
                    note: job.category.includes('FRAGILE') ? 'Fragile Goods: Handle with extreme care' : undefined,
                  })
                }
              >
                <Text style={[styles.acceptBtnText, !job.primary ? styles.acceptBtnTextSecondary : undefined]}>
                  {job.primary ? 'Accept & View Details' : 'View Details'}
                </Text>
                {job.primary && <Ionicons name="chevron-forward" size={16} color={colors.onPrimary} />}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Demand Map */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Traffic & Demand</Text>
            <Text style={styles.liveText}>Live Updates</Text>
          </View>
          <View style={styles.mapCard}>
            <MapView
              style={styles.mapView}
              provider={PROVIDER_DEFAULT}
              initialRegion={{
                latitude: -1.9500,
                longitude: 30.0850,
                latitudeDelta: 0.09,
                longitudeDelta: 0.09,
              }}
              customMapStyle={darkMapStyle}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              {/* High demand zones */}
              <Circle
                center={{ latitude: -1.9355, longitude: 30.0930 }}
                radius={600}
                fillColor="rgba(137,32,32,0.3)"
                strokeColor="rgba(137,32,32,0.6)"
                strokeWidth={1}
              />
              <Circle
                center={{ latitude: -1.9593, longitude: 30.1043 }}
                radius={400}
                fillColor="rgba(255,140,0,0.2)"
                strokeColor="rgba(255,140,0,0.5)"
                strokeWidth={1}
              />
              <Circle
                center={{ latitude: -1.9470, longitude: 30.0587 }}
                radius={500}
                fillColor="rgba(137,32,32,0.2)"
                strokeColor="rgba(137,32,32,0.4)"
                strokeWidth={1}
              />
              {/* Demand hotspot marker */}
              <Marker
                coordinate={{ latitude: -1.9355, longitude: 30.0930 }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.hotspotMarker}>
                  <Ionicons name="flame" size={12} color={colors.onPrimary} />
                </View>
              </Marker>
            </MapView>
            <View style={styles.mapBadge}>
              <View style={styles.mapBadgeDot} />
              <View>
                <Text style={styles.mapBadgeTitle}>Extreme Demand: <Text style={styles.mapBadgeAccent}>Nyarutarama</Text></Text>
                <Text style={styles.mapBadgeSub}>Est. earnings boost: +15%</Text>
              </View>
              <Ionicons name="map-outline" size={20} color={colors.primary} />
            </View>
          </View>
        </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  menuBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  logoImg: { width: 60, height: 24 },
  profileBtn: {
    width: 40, height: 40, borderRadius: borderRadius.full,
    borderWidth: 2, borderColor: 'rgba(255,179,173,0.2)', overflow: 'hidden',
  },
  profileImg: { width: 40, height: 40 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 100, gap: spacing.lg },

  // Status card
  statusCard: {
    backgroundColor: 'rgba(41,29,28,0.6)',
    borderRadius: borderRadius.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    borderWidth: 1,
    borderColor: 'rgba(255,179,173,0.1)',
    padding: spacing.lg,
    gap: spacing.md,
  },
  statusCardOnline: { borderLeftColor: '#4ADE80' },
  statusCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  welcomeText: { fontSize: 20, fontWeight: '600', color: colors.onSurface },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 4 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusDotOnline: { backgroundColor: '#4ADE80' },
  statusDotOffline: { backgroundColor: colors.error },
  statusLabel: { fontSize: 11, fontWeight: '700', color: colors.onSurfaceVariant, letterSpacing: 1, textTransform: 'uppercase' },

  toggleTrack: {
    width: 60, height: 30, borderRadius: 15,
    backgroundColor: colors.surfaceContainerHighest,
    position: 'relative', justifyContent: 'center',
  },
  toggleTrackOn: { backgroundColor: colors.primaryContainer },
  toggleThumb: {
    position: 'absolute', width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.onSurfaceVariant,
    alignItems: 'center', justifyContent: 'center',
  },

  goOnlineBtn: {
    height: 48, borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1, borderColor: 'rgba(87,65,63,0.3)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  goOnlineBtnActive: { backgroundColor: colors.primaryContainer },
  goOnlineBtnText: { fontSize: 12, fontWeight: '700', color: colors.onSurfaceVariant, letterSpacing: 1, textTransform: 'uppercase' },
  goOnlineBtnTextActive: { color: colors.primary },

  statusHint: { fontSize: 13, color: colors.onSurfaceVariant, opacity: 0.6, textAlign: 'center', fontStyle: 'italic' },

  // Earnings
  earningsRow: { flexDirection: 'row', gap: spacing.md },
  earningCard: {
    flex: 1, backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.xl, borderWidth: 1, borderColor: 'rgba(87,65,63,0.3)',
    padding: spacing.md, gap: 4,
  },
  earningLabel: { fontSize: 10, fontWeight: '600', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  earningValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 },
  earningValue: { fontSize: 22, fontWeight: '600', color: colors.primary },
  earningCurrency: { fontSize: 11, color: colors.onSurfaceVariant },
  earningTrend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  earningTrendText: { fontSize: 10, fontWeight: '700', color: '#4ADE80' },
  deliveriesBar: {
    height: 4, backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.full, marginTop: 8, overflow: 'hidden',
  },
  deliveriesBarFill: { width: '80%', height: 4, backgroundColor: colors.primary, borderRadius: borderRadius.full },

  // Section
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.onSurface },
  liveText: { fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 0.5 },
  viewToggle: {
    flexDirection: 'row', padding: 4,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.full, gap: 2,
  },
  viewToggleActive: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: borderRadius.full, backgroundColor: colors.primary },
  viewToggleActiveText: { fontSize: 11, fontWeight: '700', color: colors.onPrimary },
  viewToggleInactive: { paddingHorizontal: spacing.md, paddingVertical: 6 },
  viewToggleInactiveText: { fontSize: 11, fontWeight: '700', color: colors.onSurfaceVariant },

  // Job cards
  jobCard: {
    backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: colors.outlineVariant, overflow: 'hidden',
  },
  jobCardDim: { opacity: 0.9 },
  jobCardInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: spacing.md, paddingBottom: spacing.sm },
  jobLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, flex: 1 },
  jobIconWrap: {
    width: 40, height: 40, borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(137,32,32,0.3)', alignItems: 'center', justifyContent: 'center',
  },
  jobInfo: { flex: 1, gap: 2 },
  jobCategory: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  jobRoute: { fontSize: 15, fontWeight: '600', color: colors.onSurface },
  jobRight: { alignItems: 'flex-end' },
  jobPayout: { fontSize: 20, fontWeight: '600', color: colors.primary },
  jobPayoutMuted: { color: colors.onSurface },
  jobPayoutCurrency: { fontSize: 10, color: colors.onSurfaceVariant, textTransform: 'uppercase' },

  jobDetails: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: 'rgba(27,17,16,0.4)',
    borderRadius: borderRadius.lg, marginHorizontal: spacing.md, gap: spacing.xs,
  },
  jobDetailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  jobDetailText: { fontSize: 13, color: colors.onSurface },
  jobDetailBold: { fontWeight: '700' },

  jobMeta: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, justifyContent: 'space-between' },
  jobMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  jobMetaText: { fontSize: 12, color: colors.onSurfaceVariant },
  jobExpiringText: { fontSize: 10, fontWeight: '700', color: colors.onSurfaceVariant, textTransform: 'uppercase' },

  acceptBtn: {
    height: 52, backgroundColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  acceptBtnSecondary: { backgroundColor: colors.surfaceContainerHigh },
  acceptBtnText: { fontSize: 13, fontWeight: '700', color: colors.onPrimary, letterSpacing: 0.5, textTransform: 'uppercase' },
  acceptBtnTextSecondary: { color: colors.onSurface },

  // Map
  mapCard: {
    height: 180, borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: 'rgba(87,65,63,0.3)',
    overflow: 'hidden', position: 'relative',
  },
  mapView: {
    width: '100%',
    height: 180,
  },
  hotspotMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryContainer,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBadge: {
    position: 'absolute', bottom: spacing.md, left: spacing.md, right: spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: 'rgba(27,17,16,0.85)',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg, borderWidth: 1, borderColor: 'rgba(255,179,173,0.2)',
  },
  mapBadgeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  mapBadgeTitle: { fontSize: 12, color: colors.onSurface },
  mapBadgeAccent: { color: colors.primary, fontWeight: '600' },
  mapBadgeSub: { fontSize: 10, color: colors.onSurfaceVariant },
})
