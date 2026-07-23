import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'
import { colors, spacing, borderRadius, typography } from '../theme'

type Props = NativeStackScreenProps<RootStackParamList, 'Support'>

const categories = [
  { icon: 'help-circle-outline' as const, label: 'FAQs' },
  { icon: 'bicycle-outline' as const, label: 'Order Help' },
  { icon: 'wallet-outline' as const, label: 'Payments' },
  { icon: 'person-outline' as const, label: 'Account' },
]

const tickets = [
  { icon: 'cube-outline' as const, title: 'Order #KG-9842', subtitle: 'Driver assigned - Est. arrival 14:20', badge: 'Delayed', badgeColor: colors.error },
  { icon: 'receipt-outline' as const, title: 'Refund Requested', subtitle: 'Initiated Oct 24 · Refund to Wallet', badge: 'Processing', badgeColor: colors.onSurfaceVariant },
]

const topics = [
  'How to track my KigaliExpress delivery?',
  'Managing scheduled pickups in the city',
  'International shipping from Kigali hubs',
]

export function Support({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <Text style={styles.searchHeading}>How can we help?</Text>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={20} color={colors.onSurfaceVariant} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search articles, orders, or issues..."
            placeholderTextColor={colors.outlineVariant}
          />
        </View>

        {/* Category grid */}
        <View style={styles.categoryGrid}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat.label} style={styles.categoryCard} activeOpacity={0.7}>
              <Ionicons name={cat.icon} size={28} color={colors.primary} />
              <Text style={styles.categoryLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Live support CTA */}
        <View style={styles.liveCard}>
          <View style={styles.liveCardContent}>
            <Text style={styles.liveTitle}>Need immediate assistance?</Text>
            <Text style={styles.liveDesc}>
              Our logistics experts are online 24/7 to resolve your delivery issues in real-time.
            </Text>
          </View>
          <TouchableOpacity style={styles.liveBtn}>
            <Ionicons name="chatbubble-ellipses" size={18} color={colors.onPrimary} />
            <Text style={styles.liveBtnText}>Contact Live Support</Text>
          </TouchableOpacity>
        </View>

        {/* Recent tickets */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {tickets.map((ticket) => (
          <TouchableOpacity key={ticket.title} style={styles.ticketCard} activeOpacity={0.7}>
            <View style={styles.ticketIcon}>
              <Ionicons name={ticket.icon} size={22} color={colors.onSurfaceVariant} />
            </View>
            <View style={styles.ticketContent}>
              <View style={styles.ticketTop}>
                <Text style={styles.ticketTitle}>{ticket.title}</Text>
                <View style={[styles.ticketBadge, { backgroundColor: ticket.badgeColor + '22' }]}>
                  <Text style={[styles.ticketBadgeText, { color: ticket.badgeColor }]}>{ticket.badge}</Text>
                </View>
              </View>
              <Text style={styles.ticketSubtitle}>{ticket.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        ))}

        {/* Popular topics */}
        <Text style={styles.sectionTitle}>Popular Topics</Text>
        {topics.map((topic, i) => (
          <TouchableOpacity
            key={topic}
            style={[styles.topicRow, i < topics.length - 1 ? styles.topicRowBorder : undefined]}
            activeOpacity={0.7}
          >
            <Text style={styles.topicText}>{topic}</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.primary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  topBar: {
    height: 48, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: spacing.lg,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: colors.primary, letterSpacing: -0.5 },

  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 48 },

  searchHeading: { fontSize: 20, fontWeight: '600', color: colors.onSurface },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    height: 52, backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.md, gap: spacing.sm,
  },
  searchIcon: { marginRight: 4 },
  searchInput: { flex: 1, color: colors.onSurface, fontSize: 14 },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  categoryCard: {
    width: '47%', backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.outlineVariant,
    padding: spacing.md, gap: spacing.sm, alignItems: 'flex-start',
  },
  categoryLabel: { fontSize: 13, fontWeight: '600', color: colors.onSurface },

  liveCard: {
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.xl, padding: spacing.lg, gap: spacing.md,
  },
  liveCardContent: { gap: 6 },
  liveTitle: { fontSize: 16, fontWeight: '600', color: colors.white },
  liveDesc: { fontSize: 13, color: 'rgba(255,156,148,0.9)', lineHeight: 20 },
  liveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.white,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: borderRadius.full, alignSelf: 'flex-start',
  },
  liveBtnText: { fontSize: 13, fontWeight: '700', color: colors.onPrimary },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.onSurface },
  viewAll: { fontSize: 13, fontWeight: '600', color: colors.primary },

  ticketCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: colors.outlineVariant, padding: spacing.md,
  },
  ticketIcon: {
    width: 44, height: 44, borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center',
  },
  ticketContent: { flex: 1, gap: 3 },
  ticketTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketTitle: { fontSize: 13, fontWeight: '600', color: colors.onSurface },
  ticketBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },
  ticketBadgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  ticketSubtitle: { fontSize: 11, color: colors.onSurfaceVariant },

  topicRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.md, paddingHorizontal: spacing.xs,
  },
  topicRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  topicText: { flex: 1, fontSize: 14, color: colors.onSurface, marginRight: spacing.md },
})
