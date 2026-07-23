import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import MapView, { PROVIDER_DEFAULT } from 'react-native-maps'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'
import { colors, spacing, borderRadius, typography } from '../theme'

type Props = NativeStackScreenProps<RootStackParamList, 'SendPackage'>

const recents = [
  { label: 'Home',          sublabel: 'KG 278 St, Kigali',       icon: 'home-outline' as const },
  { label: 'Kigali Heights', sublabel: 'KG 7 Ave, Kigali',        icon: 'briefcase-outline' as const },
  { label: "Mama's Office", sublabel: 'Kimironko Market Area',    icon: 'heart-outline' as const },
]

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a0f0e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#a68a88' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a0f0e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#291d1c' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#57413f' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3f3230' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#160c0b' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#241918' }] },
]

export function SendPackage({ navigation }: Props) {
  const [dropoff, setDropoff] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')

  return (
    <View style={styles.root}>
      {/* Full-screen map */}
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: -1.9441,
          longitude: 30.0619,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
        customMapStyle={darkMapStyle}
      />

      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {/* Floating back button over map */}
        <View style={styles.backBtnWrap}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Delivery Route card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="git-branch-outline" size={18} color={colors.primary} />
              <Text style={styles.cardTitle}>DELIVERY ROUTE</Text>
            </View>

            {/* Pickup */}
            <View style={styles.routeBlock}>
              <View style={styles.routeRow}>
                <View style={styles.dotRed} />
                <View style={styles.routeFieldWrap}>
                  <Text style={styles.routeLabel}>Pickup Location</Text>
                  <View style={styles.routeInputRow}>
                    <TextInput
                      style={styles.routeInput}
                      value="Current Location (Nyarutarama)"
                      editable={false}
                      placeholderTextColor={colors.outlineVariant}
                    />
                    <Ionicons name="locate" size={20} color={colors.onSurfaceVariant} style={styles.locateIcon} />
                  </View>
                </View>
              </View>

              <View style={styles.routeConnector} />

              {/* Dropoff */}
              <View style={styles.routeRow}>
                <View style={styles.dotGray} />
                <View style={styles.routeFieldWrap}>
                  <Text style={styles.routeLabel}>Delivery To</Text>
                  <View style={styles.routeInputRowBorder}>
                    <TextInput
                      style={styles.routeInput}
                      placeholder="Enter destination address"
                      placeholderTextColor={colors.outlineVariant}
                      value={dropoff}
                      onChangeText={setDropoff}
                    />
                    <Text style={styles.mapTag}>Map</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Recipient Details card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={18} color={colors.primary} />
              <Text style={styles.cardTitle}>RECIPIENT DETAILS</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Who is receiving?"
                placeholderTextColor={colors.outlineVariant}
                value={recipientName}
                onChangeText={setRecipientName}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <View style={styles.phoneRow}>
                <View style={styles.phonePrefix}>
                  <Text style={styles.phonePrefixText}>+250</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="78X XXX XXX"
                  placeholderTextColor={colors.outlineVariant}
                  value={recipientPhone}
                  onChangeText={setRecipientPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* Recent card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={styles.cardTitle}>RECENT</Text>
            </View>

            {recents.map((r, i) => (
              <TouchableOpacity
                key={r.label}
                style={[styles.recentRow, i < recents.length - 1 ? styles.recentRowBorder : undefined]}
                onPress={() => setDropoff(r.sublabel)}
                activeOpacity={0.7}
              >
                <View style={styles.recentIcon}>
                  <Ionicons name={r.icon} size={20} color={colors.onSurfaceVariant} />
                </View>
                <View>
                  <Text style={styles.recentLabel}>{r.label}</Text>
                  <Text style={styles.recentSublabel}>{r.sublabel}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Continue button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => navigation.navigate('PackageDetails')}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>CONTINUE TO SERVICE SELECTION</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  backBtnWrap: {
    position: 'absolute',
    top: 48,
    left: spacing.md,
    zIndex: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(27,17,16,0.85)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.outlineVariant,
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: 100,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },

  // Card
  card: {
    backgroundColor: 'rgba(27,17,16,0.92)',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },

  // Route
  routeBlock: { gap: 0 },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  dotRed: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.primaryContainer,
    borderWidth: 3, borderColor: colors.primary,
    marginTop: 28, flexShrink: 0,
  },
  dotGray: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 2, borderColor: colors.outlineVariant,
    marginTop: 28, flexShrink: 0,
  },
  routeConnector: {
    width: 2, height: 12, backgroundColor: colors.outlineVariant,
    marginLeft: 8, marginVertical: 2,
  },
  routeFieldWrap: { flex: 1, gap: 6 },
  routeLabel: { fontSize: 12, color: colors.onSurfaceVariant },
  routeInputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.md, height: 48,
  },
  routeInputRowBorder: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.md, height: 48,
  },
  routeInput: { flex: 1, color: colors.onSurface, fontSize: 14 },
  locateIcon: { marginLeft: spacing.xs },
  mapTag: { fontSize: 13, fontWeight: '700', color: colors.primary, marginLeft: spacing.xs },

  // Fields
  fieldGroup: { gap: spacing.xs },
  fieldLabel: { fontSize: 13, color: colors.onSurfaceVariant },
  input: {
    height: 52, backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.md, color: colors.onSurface, fontSize: 15,
  },
  phoneRow: {
    height: 52, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.outlineVariant,
    overflow: 'hidden',
  },
  phonePrefix: {
    paddingHorizontal: spacing.md, height: '100%',
    justifyContent: 'center', borderRightWidth: 1, borderRightColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerHighest,
  },
  phonePrefixText: { fontSize: 14, fontWeight: '600', color: colors.onSurface },
  phoneInput: { flex: 1, paddingHorizontal: spacing.md, color: colors.onSurface, fontSize: 14 },

  // Recents
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 12 },
  recentRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.outlineVariant + '50' },
  recentIcon: {
    width: 40, height: 40, borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  recentLabel: { fontSize: 14, fontWeight: '600', color: colors.onSurface },
  recentSublabel: { fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 },

  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  continueBtn: {
    height: 54, backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  continueBtnText: {
    fontSize: 13, fontWeight: '800', color: colors.white, letterSpacing: 1,
  },
})
