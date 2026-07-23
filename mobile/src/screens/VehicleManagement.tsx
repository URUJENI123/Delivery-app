import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'
import { colors, spacing, borderRadius, typography } from '../theme'

type Props = NativeStackScreenProps<RootStackParamList, 'VehicleManagement'>

const documents = [
  { icon: 'document-text-outline' as const, title: 'Registration (Yellow Card)', subtitle: 'Expires: 12 Dec 2025', done: true },
  { icon: 'shield-checkmark-outline' as const, title: 'Insurance Policy', subtitle: 'Expires: 05 Aug 2024', done: true },
  { icon: 'build-outline' as const, title: 'Technical Inspection', subtitle: 'Not required yet', done: false, locked: true },
]

export function VehicleManagement({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KigaliExpress</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Active vehicle card */}
        <View style={styles.vehicleCard}>
          <View style={styles.vehicleTop}>
            <View>
              <Text style={styles.vehicleSubLabel}>ACTIVE VEHICLE</Text>
              <Text style={styles.vehicleName}>Yamaha TF125</Text>
              <Text style={styles.vehiclePlate}>RAA 123 A</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.onPrimaryContainer} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>

          {/* Vehicle image placeholder */}
          <View style={styles.vehicleImageWrap}>
            <View style={styles.vehicleImagePlaceholder}>
              <Ionicons name="bicycle" size={64} color={colors.outlineVariant} />
            </View>
            <View style={styles.vehicleImageOverlay} />
          </View>

          {/* Stats */}
          <View style={styles.vehicleStats}>
            <View style={styles.vehicleStatCard}>
              <Text style={styles.vehicleStatLabel}>FUEL LEVEL</Text>
              <View style={styles.vehicleStatRow}>
                <Ionicons name="car-outline" size={18} color={colors.primary} />
                <Text style={styles.vehicleStatValue}>85%</Text>
              </View>
            </View>
            <View style={styles.vehicleStatCard}>
              <Text style={styles.vehicleStatLabel}>TOTAL DISTANCE</Text>
              <View style={styles.vehicleStatRow}>
                <Ionicons name="speedometer-outline" size={18} color={colors.primary} />
                <Text style={styles.vehicleStatValue}>12,450 km</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Add vehicle button */}
        <TouchableOpacity style={styles.addVehicleBtn}>
          <View style={styles.addVehicleIcon}>
            <Ionicons name="add-circle" size={28} color={colors.primary} />
          </View>
          <View style={styles.addVehicleContent}>
            <Text style={styles.addVehicleTitle}>Add New Vehicle</Text>
            <Text style={styles.addVehicleSubtitle}>Register a secondary motorcycle or car</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceVariant} />
        </TouchableOpacity>

        {/* Documents */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Required Documents</Text>
          <Text style={styles.sectionBadge}>2/2 Completed</Text>
        </View>

        {documents.map((doc) => (
          <View
            key={doc.title}
            style={[styles.docCard, doc.done ? styles.docCardDone : styles.docCardLocked]}
          >
            <View style={styles.docIcon}>
              <Ionicons name={doc.icon} size={22} color={colors.onSurfaceVariant} />
            </View>
            <View style={styles.docContent}>
              <Text style={[styles.docTitle, doc.locked ? styles.docTitleMuted : undefined]}>{doc.title}</Text>
              <Text style={styles.docSubtitle}>{doc.subtitle}</Text>
            </View>
            <Ionicons
              name={doc.locked ? 'lock-closed-outline' : 'checkmark-circle'}
              size={22}
              color={doc.locked ? colors.onSurfaceVariant : colors.primary}
            />
          </View>
        ))}

        {/* Warning */}
        <View style={styles.warningCard}>
          <Ionicons name="warning" size={20} color={colors.primary} />
          <Text style={styles.warningText}>
            Keep documents updated to avoid suspension. Vehicle changes take up to 24 hours for approval.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  topBar: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.primary, letterSpacing: -0.5 },

  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },

  vehicleCard: { backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.outlineVariant, padding: spacing.lg, gap: spacing.md },
  vehicleTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  vehicleSubLabel: { fontSize: 10, fontWeight: '600', color: colors.onSurfaceVariant, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 },
  vehicleName: { fontSize: 22, fontWeight: '600', color: colors.onSurface },
  vehiclePlate: { fontSize: 15, fontWeight: '700', color: colors.primary, letterSpacing: 2 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primaryContainer, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full },
  verifiedText: { fontSize: 11, fontWeight: '600', color: colors.onPrimaryContainer },

  vehicleImageWrap: { height: 160, borderRadius: borderRadius.lg, overflow: 'hidden', position: 'relative' },
  vehicleImagePlaceholder: { flex: 1, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  vehicleImageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(27,17,16,0.3)' },

  vehicleStats: { flexDirection: 'row', gap: spacing.md },
  vehicleStatCard: { flex: 1, backgroundColor: 'rgba(41,29,28,0.6)', borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.outlineVariant, padding: spacing.md, gap: 6 },
  vehicleStatLabel: { fontSize: 9, fontWeight: '700', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  vehicleStatRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  vehicleStatValue: { fontSize: 16, fontWeight: '700', color: colors.onSurface },

  addVehicleBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surfaceContainerHighest, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.outline, borderStyle: 'dashed', padding: spacing.md },
  addVehicleIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,179,173,0.1)', alignItems: 'center', justifyContent: 'center' },
  addVehicleContent: { flex: 1, gap: 2 },
  addVehicleTitle: { fontSize: 15, fontWeight: '600', color: colors.onSurface },
  addVehicleSubtitle: { fontSize: 12, color: colors.onSurfaceVariant },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.onSurface },
  sectionBadge: { fontSize: 13, fontWeight: '600', color: colors.primary },

  docCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: 'rgba(41,29,28,0.6)', borderRadius: borderRadius.xl, borderWidth: 1, padding: spacing.md },
  docCardDone: { borderLeftWidth: 4, borderLeftColor: colors.primary },
  docCardLocked: { borderColor: colors.outlineVariant, opacity: 0.6 },
  docIcon: { width: 48, height: 48, borderRadius: borderRadius.lg, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  docContent: { flex: 1, gap: 2 },
  docTitle: { fontSize: 13, fontWeight: '600', color: colors.onSurface },
  docTitleMuted: { color: colors.onSurfaceVariant },
  docSubtitle: { fontSize: 11, color: colors.onSurfaceVariant },

  warningCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: 'rgba(137,32,32,0.2)', borderWidth: 1, borderColor: colors.primaryContainer, borderRadius: borderRadius.lg, padding: spacing.md },
  warningText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.onPrimaryContainer, lineHeight: 18 },
})
