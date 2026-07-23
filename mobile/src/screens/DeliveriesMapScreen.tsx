import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'
import { colors, spacing, borderRadius } from '../theme'

type Props = NativeStackScreenProps<RootStackParamList, 'DeliveriesMap'>

const ACTIVE_DELIVERIES = [
  {
    id: '1',
    name: 'Medical Supplies',
    status: 'IN TRANSIT',
    pickup: 'King Faisal Hospital',
    dropoff: 'Kacyiru Health Centre',
    coordinate: { latitude: -1.9355, longitude: 30.1043 },
  },
  {
    id: '2',
    name: 'Fashion Items',
    status: 'PICKED UP',
    pickup: 'Kimironko Market',
    dropoff: 'Remera Plaza',
    coordinate: { latitude: -1.9440, longitude: 30.0930 },
  },
  {
    id: '3',
    name: 'Electronics Package',
    status: 'IN TRANSIT',
    pickup: 'Gikondo Industrial Park',
    dropoff: 'Kiyovu Office Park',
    coordinate: { latitude: -1.9593, longitude: 30.0587 },
  },
  {
    id: '4',
    name: 'Legal Documents',
    status: 'PICKED UP',
    pickup: 'Kigali City Hall',
    dropoff: 'Nyarutarama',
    coordinate: { latitude: -1.9510, longitude: 30.0740 },
  },
  {
    id: '5',
    name: 'Grocery Bundle',
    status: 'IN TRANSIT',
    pickup: 'UTC Remera',
    dropoff: 'Rebero Residential',
    coordinate: { latitude: -1.9650, longitude: 30.1120 },
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

function markerColor(status: string) {
  return status === 'IN TRANSIT' ? colors.primary : '#FFB300'
}

export function DeliveriesMapScreen({ navigation }: Props) {
  const [search, setSearch] = useState('')

  const filtered = search.trim().length > 0
    ? ACTIVE_DELIVERIES.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.pickup.toLowerCase().includes(search.toLowerCase()) ||
        d.dropoff.toLowerCase().includes(search.toLowerCase())
      )
    : ACTIVE_DELIVERIES

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
        {filtered.map((d) => (
          <Marker
            key={d.id}
            coordinate={d.coordinate}
            anchor={{ x: 0.5, y: 0.5 }}
            onPress={() =>
              navigation.navigate('DeliveryInfo', {
                orderId: `KV-${440 + Number(d.id)}`,
                pickup: d.pickup,
                dropoff: d.dropoff,
                totalDistance: '—',
                eta: '—',
              })
            }
          >
            <View style={[styles.marker, { borderColor: markerColor(d.status) }]}>
              <Ionicons name="bicycle" size={14} color={markerColor(d.status)} />
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
            <Text style={styles.topBarTitleText}>Active Deliveries</Text>
          </View>
          <View style={styles.topBarBtn} />
        </View>
      </SafeAreaView>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchInputWrap}>
          <Ionicons name="search-outline" size={18} color={colors.onSurfaceVariant} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search deliveries..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Count badge */}
      <View style={styles.countBadge} pointerEvents="none">
        <View style={styles.countDot} />
        <Text style={styles.countText}>
          {filtered.length} {search.trim().length > 0 ? 'matching' : 'active'} deliveries
        </Text>
      </View>

      {/* Legend */}
      <View style={styles.legend} pointerEvents="none">
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>In Transit</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FFB300' }]} />
          <Text style={styles.legendText}>Picked Up</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },

  topBarOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
  },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, height: 52,
  },
  topBarBtn: {
    width: 38, height: 38, borderRadius: borderRadius.full,
    backgroundColor: 'rgba(26,15,14,0.85)', alignItems: 'center', justifyContent: 'center',
  },
  topBarTitle: {
    backgroundColor: 'rgba(26,15,14,0.85)', paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: colors.outlineVariant,
  },
  topBarTitleText: { fontSize: 13, fontWeight: '700', color: colors.onSurface, letterSpacing: 0.5 },

  searchBar: { position: 'absolute', top: 110, left: spacing.md, right: spacing.md },
  searchInputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: 'rgba(26,15,14,0.92)', borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.md, height: 46,
  },
  searchInput: { flex: 1, color: colors.onSurface, fontSize: 14 },

  marker: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.darkCharcoal, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4, shadowRadius: 4, elevation: 6,
  },

  countBadge: {
    position: 'absolute', top: 168, left: spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(26,15,14,0.85)', paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.outlineVariant,
  },
  countDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  countText: { fontSize: 13, fontWeight: '700', color: colors.onSurface },

  legend: {
    position: 'absolute', bottom: spacing.xl, alignSelf: 'center',
    flexDirection: 'row', gap: spacing.lg,
    backgroundColor: 'rgba(26,15,14,0.85)', paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: colors.outlineVariant,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: colors.onSurfaceVariant },
})
