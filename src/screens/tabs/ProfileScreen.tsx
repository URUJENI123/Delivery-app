import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { colors, spacing, typography, borderRadius } from '../../theme'
import type { RootStackParamList, RootTabParamList } from '../../types'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'

type Props = BottomTabScreenProps<RootTabParamList, 'Profile'>
type NavProp = NativeStackNavigationProp<RootStackParamList>

const allMenuItems = [
  { icon: 'person-outline',           label: 'Personal Details',    screen: 'PersonalDetails',   courierOnly: false, senderOnly: false },
  { icon: 'wallet-outline',           label: 'Wallet',              screen: 'Wallet',            courierOnly: true,  senderOnly: false },
  // { icon: 'card-outline',             label: 'Payment Methods',     screen: 'PaymentMethod',     courierOnly: false, senderOnly: true  },
  { icon: 'location-outline',         label: 'Saved Addresses',     screen: null,                courierOnly: false, senderOnly: true  },
  // { icon: 'shield-checkmark-outline', label: 'Verification',        screen: null,                courierOnly: true,  senderOnly: false },
  { icon: 'notifications-outline',    label: 'Notifications',       screen: 'Notifications',     courierOnly: false, senderOnly: false },
  { icon: 'bicycle-outline',          label: 'Vehicle Management',  screen: 'VehicleManagement', courierOnly: true,  senderOnly: false },
  { icon: 'headset-outline',          label: 'Help Center',         screen: 'Support',           courierOnly: false, senderOnly: false },
  { icon: 'settings-outline',         label: 'Settings',            screen: 'Settings',          courierOnly: false, senderOnly: false },
]

export function ProfileScreen({ route }: Props) {
  const isCourier = (route?.params as any)?.isCourier ?? false
  const menuItems = allMenuItems.filter(item =>
    (!item.courierOnly || isCourier) && (!item.senderOnly || !isCourier)
  )
  const [logoutModal, setLogoutModal] = useState(false)
  const navigation = useNavigation<NavProp>()

  function handleLogout() {
    setLogoutModal(false)
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Logout modal */}
      <Modal visible={logoutModal} transparent animationType="fade" onRequestClose={() => setLogoutModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="log-out-outline" size={28} color={colors.error} />
            </View>
            <Text style={styles.modalTitle}>Log Out?</Text>
            <Text style={styles.modalDesc}>
              Are you sure you want to log out? You'll need to sign back in to receive new orders.
            </Text>
            <TouchableOpacity style={styles.logoutConfirmBtn} onPress={handleLogout}>
              <Text style={styles.logoutConfirmText}>Log Out</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setLogoutModal(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.topBar}>
        <View style={{ width: 24 }} />
        <Text style={styles.topBarTitle}>Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Avatar */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={colors.white} />
            </View>
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={14} color={colors.onPrimary} />
            </View>
          </View>
          <Text style={styles.name}>Amani Karangwa</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="checkmark-circle" size={14} color={colors.onPrimaryContainer} />
            <Text style={styles.roleBadgeText}>Premier Courier</Text>
            <View style={styles.roleDivider} />
            <Ionicons name="star" size={13} color={colors.onPrimaryContainer} />
            <Text style={styles.roleBadgeText}>4.9</Text>
          </View>
        </View>

        {/* Stats — courier only */}
        {isCourier && (
          <View style={styles.statsRow}>
            {[['928', 'Deliveries'], ['4.9', 'Rating'], ['2', 'Years']].map(([val, label], i) => (
              <View key={label} style={styles.statGroup}>
                {i > 0 && <View style={styles.statDivider} />}
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{val}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Account settings */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionLabel}>Account Settings</Text>
          <View style={styles.menuCard}>
            {menuItems.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, i < menuItems.length - 1 ? styles.menuItemBorder : undefined]}
                onPress={() => item.screen && navigation.navigate(item.screen as any)}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconWrap}>
                  <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout */}
        <View style={styles.sectionGroup}>
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} onPress={() => setLogoutModal(true)}>
              <View style={[styles.menuIconWrap, styles.menuIconWrapDanger]}>
                <Ionicons name="log-out-outline" size={20} color={colors.error} />
              </View>
              <Text style={[styles.menuLabel, styles.menuLabelDanger]}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.versionText}>App Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, height: 52 },
  topBarTitle: { fontSize: 16, fontWeight: '700', color: colors.onSurface },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // Avatar
  profileHeader: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.primaryContainer,
  },
  editBadge: {
    position: 'absolute', bottom: 4, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 22, fontWeight: '600', color: colors.onSurface, marginTop: spacing.sm },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primaryContainer, paddingHorizontal: spacing.md, paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  roleBadgeText: { fontSize: 12, fontWeight: '600', color: colors.onPrimaryContainer },
  roleDivider: { width: 1, height: 12, backgroundColor: colors.outlineVariant },

  // Stats
  statsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.lg, backgroundColor: colors.surfaceContainer,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.outlineVariant,
  },
  statGroup: { flexDirection: 'row', alignItems: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: colors.outlineVariant, marginHorizontal: spacing.xxl },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.onSurface },
  statLabel: { ...typography.labelSm, color: colors.onSurfaceVariant },

  // Menu
  sectionGroup: { padding: spacing.lg, paddingBottom: 0, gap: spacing.sm },
  sectionLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', color: colors.onSurfaceVariant },
  menuCard: { backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.outlineVariant, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.outlineVariant + '40' },
  menuIconWrap: { width: 40, height: 40, borderRadius: borderRadius.lg, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  menuIconWrapDanger: { backgroundColor: 'rgba(147,0,10,0.1)' },
  menuLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.onSurface },
  menuLabelDanger: { color: colors.error },

  versionText: { textAlign: 'center', fontSize: 11, color: colors.onSurfaceVariant, opacity: 0.5, marginTop: spacing.lg, marginBottom: spacing.sm },

  // Logout modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  modalCard: { width: '100%', maxWidth: 360, backgroundColor: colors.surfaceContainerHigh, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.outlineVariant, padding: spacing.lg, alignItems: 'center', gap: spacing.md },
  modalIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(147,0,10,0.1)', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: colors.onSurface },
  modalDesc: { fontSize: 14, color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22 },
  logoutConfirmBtn: { width: '100%', height: 48, backgroundColor: colors.primaryContainer, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  logoutConfirmText: { fontSize: 15, fontWeight: '700', color: colors.onPrimary },
  cancelBtn: { width: '100%', height: 48, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.outlineVariant, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: colors.onSurface },
})
