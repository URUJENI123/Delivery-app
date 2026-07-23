import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { colors, spacing, typography, borderRadius } from '../../theme'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { RootTabParamList, RootStackParamList } from '../../types'

type Props = BottomTabScreenProps<RootTabParamList, 'Jobs'>
type NavProp = NativeStackNavigationProp<RootStackParamList>

const jobs = [
  {
    category: 'ELECTRONICS', route: 'Kacyiru → Kimironko', payout: '3,000 RWF',
    pickup: 'Pick-up: Kigali Heights', dropoff: 'Drop-off: Kimironko Market',
    distance: '4.2 km', duration: '25 mins',
  },
  {
    category: 'DOCUMENTS', route: 'Nyarutarama → City Center', payout: '2,500 RWF',
    pickup: 'Pick-up: MTN Centre', dropoff: 'Drop-off: Car Free Zone',
    distance: '6.1 km', duration: '18 mins',
  },
  {
    category: 'PACKAGE', route: 'Kacyiru Hub → Gikondo', payout: '1,500 RWF',
    pickup: 'Pick-up: Kacyiru Hub', dropoff: 'Drop-off: Gikondo Industrial',
    distance: '3.5 km', duration: '15 mins',
  },
]

export function JobsScreen({ route }: Props) {
  const navigation = useNavigation<NavProp>()
  const isCourier = route?.params?.isCourier ?? false

  function handleDeliveryInfo(job: typeof jobs[0], index: number) {
    navigation.navigate('DeliveryInfo', {
      orderId: `KV-${442 + index}`,
      pickup: job.pickup.replace('Pick-up: ', ''),
      dropoff: job.dropoff.replace('Drop-off: ', ''),
      totalDistance: job.distance,
      eta: job.duration,
      note: job.category === 'ELECTRONICS' ? 'Fragile Goods: Handle with extreme care' : undefined,
    })
  }

  const visibleJobs = jobs

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.logoImg}
          resizeMode="contain"
        />
        <Ionicons name="notifications-outline" size={24} color={colors.onSurfaceVariant} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subheading}>{visibleJobs.length} deliveries near you</Text>
        {!isCourier && (
          <TouchableOpacity style={styles.sendBtn} onPress={() => navigation.navigate('SendPackage')}>
            <Ionicons name="add-circle" size={18} color={colors.onPrimary} />
            <Text style={styles.sendBtnText}>Send a Package</Text>
          </TouchableOpacity>
        )}
        {visibleJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bicycle-outline" size={48} color={colors.outlineVariant} />
            <Text style={styles.emptyText}>No available jobs right now</Text>
            <Text style={styles.emptySubText}>Check back soon for new deliveries near you</Text>
          </View>
        ) : (
          visibleJobs.map((job) => {
            const originalIndex = jobs.indexOf(job)
            return (
              <View key={originalIndex} style={styles.jobCard}>
                <View style={styles.jobCategory}>
                  <Text style={styles.jobCategoryText}>{job.category}</Text>
                </View>
                <View style={styles.jobMain}>
                  <View style={styles.jobLeft}>
                    <Text style={styles.jobRoute}>{job.route}</Text>
                    <View style={styles.jobDetails}>
                      <View style={styles.jobDetail}>
                        <Ionicons name="location-outline" size={12} color={colors.onSurfaceVariant} />
                        <Text style={styles.jobDetailText}>{job.pickup}</Text>
                      </View>
                      <View style={styles.jobDetail}>
                        <Ionicons name="flag-outline" size={12} color={colors.onSurfaceVariant} />
                        <Text style={styles.jobDetailText}>{job.dropoff}</Text>
                      </View>
                    </View>
                    <View style={styles.jobMeta}>
                      <Text style={styles.jobMetaText}>{job.distance}</Text>
                      <Text style={styles.jobMetaDot}>•</Text>
                      <Text style={styles.jobMetaText}>{job.duration}</Text>
                    </View>
                  </View>
                  <Text style={styles.jobPayout}>{job.payout}</Text>
                </View>
                {isCourier && (
                  <View style={styles.jobActions}>
                    <TouchableOpacity
                      style={styles.deliveryInfoBtn}
                      onPress={() => handleDeliveryInfo(job, originalIndex)}
                    >
                      <Ionicons name="information-circle-outline" size={16} color={colors.white} />
                      <Text style={styles.deliveryInfoBtnText}>JOB INFO</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )
          })
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, height: 52,
  },
  topBarTitle: { fontSize: 16, fontWeight: '700', color: colors.onSurface },
  logoImg: { width: 80, height: 32 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: 32 },
  subheading: { fontSize: 14, color: colors.onSurfaceVariant, marginBottom: spacing.xs },
  sendBtn: {
    height: 48, backgroundColor: colors.primaryContainer, borderRadius: borderRadius.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sendBtnText: { fontSize: 14, fontWeight: '700', color: colors.white },
  jobCard: {
    borderRadius: borderRadius.xl, backgroundColor: colors.surfaceContainer,
    padding: spacing.md, gap: spacing.md, borderWidth: 1, borderColor: colors.outlineVariant,
  },
  jobCategory: {
    backgroundColor: colors.primaryContainer + '20', borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, alignSelf: 'flex-start',
  },
  jobCategoryText: { fontSize: 10, fontWeight: '700', color: colors.primary, letterSpacing: 1 },
  jobMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  jobLeft: { flex: 1, gap: spacing.sm },
  jobRoute: { fontSize: 14, fontWeight: '600', color: colors.onSurface },
  jobDetails: { gap: spacing.xs },
  jobDetail: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  jobDetailText: { ...typography.labelSm, color: colors.onSurfaceVariant },
  jobMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  jobMetaText: { fontSize: 11, color: colors.onSurfaceVariant },
  jobMetaDot: { color: colors.onSurfaceVariant, fontSize: 8 },
  jobPayout: { fontSize: 15, fontWeight: '700', color: colors.primary },
  jobActions: { flexDirection: 'row', gap: spacing.sm },
  deliveryInfoBtn: {
    flex: 1, height: 40, backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.lg, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
  },
  deliveryInfoBtnText: { fontSize: 12, fontWeight: '700', color: colors.white, letterSpacing: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: spacing.sm },
  emptyText: { fontSize: 15, fontWeight: '600', color: colors.onSurfaceVariant },
  emptySubText: { fontSize: 13, color: colors.onSurfaceVariant, opacity: 0.6, textAlign: 'center' },
})
