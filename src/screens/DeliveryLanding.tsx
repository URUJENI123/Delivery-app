import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, typography, borderRadius } from '../theme'
import { BottomNavBar } from '../components/BottomNavBar'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'

type Props = NativeStackScreenProps<RootStackParamList, 'DeliveryLanding'>

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PAD = spacing.lg
const heading = { fontFamily: 'Poppins' }
const bodyF = { fontFamily: 'Inter' }

const particles = Array.from({ length: 40 }, (_, i) => {
  const n = i * 17 + 13
  return {
    left: ((n * 7) % 88) + 2,
    top: ((n * 13) % 88) + 2,
    size: 2 + ((n * 3) % 7),
    opacity: 0.1 + ((n % 5) * 0.1),
  }
})

const features = [
  {
    icon: 'shield-checkmark' as const,
    title: 'OTP Security',
    desc: 'Advanced two-factor verification for every hand-off. Your parcel only moves when you say so.',
  },
  {
    icon: 'wallet' as const,
    title: 'Escrow Protection',
    desc: 'Funds are held securely in transit. Couriers are paid instantly upon successful delivery confirmation.',
    center: true,
  },
  {
    icon: 'location' as const,
    title: 'Real-time Tracking',
    desc: 'Precision GPS monitoring from start to finish. Watch your delivery move through Kigali in high-fidelity.',
  },
]

export function DeliveryLanding({ navigation }: Props) {
  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <TouchableOpacity style={s.topBarBtn}>
          <Ionicons name="menu" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={s.logo}>KigaliExpress</Text>
        <View style={s.profileImg} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollInner}>
        <View style={s.hero}>
          {particles.map((p, i) => (
            <View
              key={i}
              style={[
                s.particle,
                {
                  left: `${p.left}%`,
                  top: `${p.top}%`,
                  width: p.size,
                  height: p.size,
                  opacity: p.opacity,
                  borderRadius: p.size / 2,
                },
              ]}
            />
          ))}

          <View style={s.heroContent}>
            <View style={s.badge}>
              <View style={s.pulseDot} />
              <Text style={s.badgeText}>Kigali Real-time</Text>
            </View>

            <Text style={s.heroTitle}>
              Speed. Precision.{'\n'}
              <Text style={s.heroTitleHighlight}>Urban Authority.</Text>
            </Text>

            <Text style={s.heroTagline}>
              Experience the pulse of Kigali's most reliable delivery network. From professional couriers
              to real-time tracking, we move your world with kinetic energy.
            </Text>

            <View style={s.ctaRow}>
              <TouchableOpacity
                style={s.ctaPrimary}
                onPress={() => navigation.navigate('CourierOnboardingStep1')}
              >
                <Text style={s.ctaPrimaryText}>Send a Package</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={s.ctaOutlined}>
                <Text style={s.ctaOutlinedText}>Track Delivery</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.visualArea}>
            <View style={s.imagePlaceholder}>
              <View style={s.statsCardBL}>
                <Text style={s.statsLabel}>Current Speed</Text>
                <Text style={s.statsValue}>1428</Text>
                <Text style={s.statsSub}>Deliveries today</Text>
              </View>
              <View style={s.statsCardTR}>
                <View style={s.avatarRow}>
                  <View style={s.avatar}>
                    <Ionicons name="person" size={14} color={colors.primary} />
                  </View>
                  <View style={[s.avatar, s.avatarOffset]}>
                    <Ionicons name="person" size={14} color={colors.primary} />
                  </View>
                </View>
                <Text style={s.statsValue}>84</Text>
                <Text style={s.statsSub}>Online Couriers</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={s.features}>
          <Text style={s.sectionTitle}>Elite Logistics Features</Text>
          <View style={s.featureList}>
            {features.map((f) => (
              <View
                key={f.title}
                style={[s.featureCard, f.center ? s.featureCardCenter : undefined]}
              >
                <View style={[s.featureIconWrap, f.center ? s.featureIconCenter : undefined]}>
                  <Ionicons
                    name={f.icon}
                    size={24}
                    color={f.center ? colors.white : colors.primary}
                  />
                </View>
                <Text style={s.featureTitle}>{f.title}</Text>
                <Text style={s.featureDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.mapSection}>
          <View style={s.mapOverlay} />
          <View style={s.mapContent}>
            <View style={s.mapBadge}>
              <Ionicons name="location" size={14} color={colors.primary} />
              <Text style={s.mapBadgeText}>Live Kigali Hubs</Text>
            </View>
            <Text style={s.mapTitle}>Omnipresent Infrastructure</Text>
            <Text style={s.mapDesc}>
              With 12 micro-hubs scattered across the city, we guarantee a courier at your doorstep in
              under 15 minutes.
            </Text>
            <TouchableOpacity style={s.mapBtn}>
              <Text style={s.mapBtnText}>Explore Hubs</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.footer}>
          <Text style={s.footerLogo}>KigaliExpress</Text>
          <Text style={s.footerDesc}>
            Kigali's on-demand courier network — delivering speed, security, and precision across the
            city.
          </Text>
          <View style={s.socialRow}>
            <View style={s.socialIcon}>
              <Ionicons name="logo-facebook" size={18} color={colors.onSurfaceVariant} />
            </View>
            <View style={s.socialIcon}>
              <Ionicons name="logo-twitter" size={18} color={colors.onSurfaceVariant} />
            </View>
            <View style={s.socialIcon}>
              <Ionicons name="logo-instagram" size={18} color={colors.onSurfaceVariant} />
            </View>
            <View style={s.socialIcon}>
              <Ionicons name="logo-linkedin" size={18} color={colors.onSurfaceVariant} />
            </View>
          </View>
          <View style={s.footerLinkRow}>
            <View style={s.footerLinkCol}>
              <Text style={s.footerLinkTitle}>Platform</Text>
              <Text style={s.footerLink}>Pricing Plans</Text>
              <Text style={s.footerLink}>Courier Portal</Text>
              <Text style={s.footerLink}>API for Business</Text>
              <Text style={s.footerLink}>Safety Protocols</Text>
            </View>
            <View style={s.footerLinkCol}>
              <Text style={s.footerLinkTitle}>Support</Text>
              <Text style={s.footerLink}>Help Center</Text>
              <Text style={s.footerLink}>Contact Support</Text>
              <Text style={s.footerLink}>Privacy Policy</Text>
              <Text style={s.footerLink}>Terms of Service</Text>
            </View>
          </View>
          <Text style={s.copyright}>© 2026 KigaliExpress. All rights reserved.</Text>
        </View>
      </ScrollView>

      <BottomNavBar activeTab="Dashboard" onTabPress={() => {}} />
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PAD,
    paddingTop: 12,
    backgroundColor: colors.background,
  },
  topBarBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  logo: {
    ...typography.headlineSm,
    ...heading,
    color: colors.primary,
    letterSpacing: 2,
  },
  profileImg: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerHigh,
  },

  scroll: {
    flex: 1,
  },
  scrollInner: {
    paddingBottom: 32,
  },

  hero: {
    backgroundColor: colors.primaryContainer,
    overflow: 'hidden',
    position: 'relative',
    paddingTop: 80,
    paddingBottom: 48,
  },
  particle: {
    position: 'absolute',
    backgroundColor: colors.primary,
  },
  heroContent: {
    paddingHorizontal: PAD,
    gap: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  badgeText: {
    ...typography.labelSm,
    ...bodyF,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  heroTitle: {
    ...typography.displayLgMobile,
    ...heading,
    color: colors.white,
  },
  heroTitleHighlight: {
    color: colors.onPrimaryContainer,
  },
  heroTagline: {
    ...typography.bodyMd,
    ...bodyF,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 26,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: borderRadius.full,
  },
  ctaPrimaryText: {
    ...typography.labelMd,
    ...bodyF,
    color: colors.onPrimary,
  },
  ctaOutlined: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: 'rgba(255,179,173,0.3)',
  },
  ctaOutlinedText: {
    ...typography.labelMd,
    ...bodyF,
    color: colors.white,
  },

  visualArea: {
    paddingHorizontal: PAD,
    marginTop: 32,
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: SCREEN_WIDTH - PAD * 2,
    aspectRatio: 1,
    maxWidth: 400,
    borderRadius: 32,
    backgroundColor: colors.surfaceVariant,
    position: 'relative',
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  statsCardBL: {
    position: 'absolute',
    bottom: -16,
    left: -8,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  statsCardTR: {
    position: 'absolute',
    top: -16,
    right: -8,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  statsLabel: {
    ...typography.labelSm,
    ...bodyF,
    color: colors.onSurfaceVariant,
  },
  statsValue: {
    ...typography.headlineSm,
    ...heading,
    color: colors.primary,
  },
  statsSub: {
    ...typography.labelSm,
    ...bodyF,
    color: colors.onSurfaceVariant,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surfaceContainerHigh,
  },
  avatarOffset: {
    marginLeft: -8,
  },

  features: {
    padding: PAD,
    paddingVertical: 80,
    gap: 48,
  },
  sectionTitle: {
    ...typography.displayLgMobile,
    ...heading,
    color: colors.onBackground,
  },
  featureList: {
    gap: 24,
  },
  featureCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 24,
    padding: 24,
    gap: 12,
  },
  featureCardCenter: {},
  featureIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(137,32,32,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconCenter: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  featureTitle: {
    ...typography.headlineSm,
    ...heading,
    color: colors.onBackground,
  },
  featureDesc: {
    ...typography.bodyMd,
    ...bodyF,
    color: colors.onSurfaceVariant,
    lineHeight: 24,
  },

  mapSection: {
    marginHorizontal: PAD,
    marginBottom: 40,
    borderRadius: 32,
    backgroundColor: colors.mapBackground,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
    position: 'relative',
  },
  mapOverlay: {
    ...(StyleSheet.absoluteFill as object),
    backgroundColor: 'rgba(22,11,11,0.6)',
  },
  mapContent: {
    padding: 32,
    gap: 16,
    alignItems: 'flex-start',
  },
  mapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,179,173,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  mapBadgeText: {
    ...typography.labelSm,
    ...bodyF,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  mapTitle: {
    ...typography.displayLgMobile,
    ...heading,
    color: colors.onBackground,
  },
  mapDesc: {
    ...typography.bodyMd,
    ...bodyF,
    color: colors.onSurfaceVariant,
    lineHeight: 26,
  },
  mapBtn: {
    backgroundColor: colors.darkEspresso,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: borderRadius.full,
    marginTop: 8,
  },
  mapBtnText: {
    ...typography.labelMd,
    ...bodyF,
    color: colors.white,
  },

  footer: {
    paddingHorizontal: PAD,
    paddingVertical: 64,
    paddingBottom: 32,
    gap: 24,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  footerLogo: {
    ...typography.displayLgMobile,
    ...heading,
    color: colors.primary,
    letterSpacing: 2,
  },
  footerDesc: {
    ...typography.bodyMd,
    ...bodyF,
    color: colors.onSurfaceVariant,
    lineHeight: 24,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 16,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLinkRow: {
    flexDirection: 'row',
    gap: 48,
  },
  footerLinkCol: {
    gap: 12,
  },
  footerLinkTitle: {
    ...typography.labelMd,
    ...bodyF,
    color: colors.onBackground,
    marginBottom: 4,
  },
  footerLink: {
    ...typography.bodyMd,
    ...bodyF,
    color: colors.onSurfaceVariant,
  },
  copyright: {
    ...typography.labelSm,
    ...bodyF,
    color: colors.outline,
    marginTop: 8,
  },
})
