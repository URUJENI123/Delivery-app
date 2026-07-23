import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'
import { colors, spacing, borderRadius } from '../theme'

type Props = NativeStackScreenProps<RootStackParamList, 'JobsMap'>

// Mock available jobs with coordinates (Kigali area)
const AVAILABLE_JOBS = [
  {
    id: '1',
    category: 'ELECTRONICS · FRAGILE',
    route: 'Kacyiru → Kimironko',
    payout: '3,000 RWF',
    pickup: 'Kigali Heights',
    dropoff: 'Kimironko Market',
    distance: '4.2 km',
    duration: '25 mins',
    coordinate: { latitude: -1.9355, longitude: 30.1043 },
  },
  {
    id: '2',
    category: 'DOCUMENTS · STANDARD',
    route: 'Nyarutarama → Center',
    payout: '2,500 RWF',
    pickup: 'MTN Centre',
    dropoff: 'Car Free Zone',
    distance: '6.1 km',
    duration: '18 mins',
    coordinate: { latitude: -1.9440, longitude: 30.0930 },
  },
  {
    id: '3',
    category: 'PACKAGE · STANDARD',
    route: 'Kacyiru Hub → Gikondo',
    payout: '1,500 RWF',
    pickup: 'Kacyiru Hub',
    dropoff: 'Gikondo Industrial',
    distance: '3.5 km',
    duration: '15 mins',
    coordinate: { latitude: -1.9593, longitude: 30.0587 },
  },
  {
    id: '4',
    category: 'FOOD · URGENT',
    route: 'Remera → Kicukiro',
    payout: '2,000 RWF',
    pickup: 'UTC Remera',
    dropoff: 'Kicukiro Centre',
    distance: '5.0 km',
    duration: '20 mins',
    coordinate: { latitude: -1.9650, longitude: 30.1120 },
  },
  {
    id: '5',
    category: 'PARCEL · STANDARD',
    route: 'Kimihurura → Kiyovu',
    payout: '1,800 RWF',
    pickup: 'Kimihurura Plaza',
    dropoff: 'Kiyovu Office Park',
    distance: '2.8 km',
    duration: '12 mins',
    coordinate: { latitude: -1.9510, longitude: 30.0740 },
  },
]

const MAP_REGION = {
  latitude: -1.9500,
  longitude: 30.0850,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
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

export function JobsMapScreen({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter jobs based on search query
  const filteredJobs = searchQuery.trim().length > 0
    ? AVAILABLE_JOBS.filter(job =>
        job.pickup.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.dropoff.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.route.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : AVAILABLE_JOBS

  return (
    <View style={styles.container}>
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
        {filteredJobs.map((job) => (
          <Marker
            key={job.id}
            coordinate={job.coordinate}
            anchor={{ x: 0.5, y: 0.5 }}
            onPress={() =>
              navigation.navigate('DeliveryInfo', {
                orderId: `KV-44${job.id}`,
                pickup: job.pickup,
                dropoff: job.dropoff,
                totalDistance: job.distance,
                eta: job.duration,
                note: job.category.includes('FRAGILE')
                  ? 'Fragile Goods: Handle with extreme care'
                  : undefined,
              })
            }
          >
            <View style={styles.marker}>
              <Ionicons name="cube-outline" size={14} color={colors.onPrimary} />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Top bar overlay */}
      <SafeAreaView style={styles.topBarOverlay} edges={['top']} pointerEvents="box-none">
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topBarBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.topBarTitle}>
            <Text style={styles.topBarTitleText}>Jobs Near You</Text>
          </View>
          <View style={styles.topBarBtn} />
        </View>
      </SafeAreaView>

      {/* Search bar */}
      <View style={styles.searchBar} pointerEvents="box-none">
        <View style={styles.searchInputWrap}>
          <Ionicons name="search-outline" size={20} color={colors.onSurfaceVariant} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search location..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Jobs count badge */}
      <View style={styles.countBadge} pointerEvents="none">
        <View style={styles.countDot} />
        <Text style={styles.countText}>
          {filteredJobs.length} {searchQuery.trim().length > 0 ? 'matching' : 'available'} jobs
        </Text>
      </View>

      {/* Bottom hint */}
      <View style={styles.hintBar} pointerEvents="none">
        <Ionicons name="information-circle-outline" size={16} color={colors.onSurfaceVariant} />
        <Text style={styles.hintText}>Tap a pin to view job details</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },

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
    backgroundColor: 'rgba(26,15,14,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    backgroundColor: 'rgba(26,15,14,0.85)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  topBarTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurface,
    letterSpacing: 0.5,
  },

  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
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

  countBadge: {
    position: 'absolute',
    top: 168,
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
  countDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurface,
  },

  hintBar: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(26,15,14,0.85)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  hintText: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },

  searchBar: {
    position: 'absolute',
    top: 110,
    left: spacing.md,
    right: spacing.md,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(26,15,14,0.92)',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.md,
    height: 46,
  },
  searchInput: {
    flex: 1,
    color: colors.onSurface,
    fontSize: 14,
  },
})
