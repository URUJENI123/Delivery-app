import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRef, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { colors, spacing, borderRadius, typography } from '../theme'
import type { RootStackParamList } from '../types'

const SCREEN_WIDTH = Dimensions.get('window').width
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75

type NavProp = NativeStackNavigationProp<RootStackParamList>

interface MenuItem {
  key: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
  active?: boolean
  screen?: keyof RootStackParamList
}

const menuItems: MenuItem[] = [
  { key: 'home',      label: 'Home',            icon: 'home-outline',    screen: 'SenderDashboard' },
  { key: 'shipments', label: 'Active Shipments', icon: 'bicycle-outline', active: true, screen: 'OrderHistory' },
  { key: 'history',   label: 'Order History',    icon: 'time-outline',    screen: 'OrderHistory' },
  { key: 'wallet',    label: 'Wallet',           icon: 'wallet-outline',  screen: 'Wallet' },
  { key: 'hubs',      label: 'Kigali Hubs',      icon: 'location-outline' },
]

const bottomItems: MenuItem[] = [
  { key: 'support',  label: 'Support',  icon: 'help-circle-outline', screen: 'Support' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline' },
]

interface Props {
  visible: boolean
  onClose: () => void
}

export function DrawerMenu({ visible, onClose }: Props) {
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current
  const navigation = useNavigation<NavProp>()

  function handleItem(screen?: keyof RootStackParamList) {
    onClose()
    if (screen) {
      setTimeout(() => navigation.navigate(screen as any), 260)
    }
  }

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : -DRAWER_WIDTH,
      duration: 260,
      useNativeDriver: true,
    }).start()
  }, [visible])

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: translateX.interpolate({
                inputRange: [-DRAWER_WIDTH, 0],
                outputRange: [0, 1],
              }),
            },
          ]}
        />
      </TouchableWithoutFeedback>

      {/* Drawer panel */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
        <SafeAreaView style={styles.inner} edges={['top', 'bottom']}>
          {/* User profile */}
          <View style={styles.profile}>
            <View style={styles.avatarWrap}>
              <Ionicons name="person" size={22} color={colors.white} />
            </View>
            <View>
              <Text style={styles.profileName}>Amani Karangwa</Text>
              <Text style={styles.profileSub}>Premier Member • Kigali, RW</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Main menu */}
          <View style={styles.menuList}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.menuItem}
                activeOpacity={0.6}
                onPress={() => handleItem(item.screen)}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={item.active ? colors.primaryContainer : colors.onSurfaceVariant}
                />
                <Text style={[styles.menuLabel, item.active ? styles.menuLabelActive : undefined]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bottom items */}
          <View style={styles.bottomMenu}>
            <View style={styles.divider} />
            {bottomItems.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.menuItem}
                activeOpacity={0.6}
                onPress={() => handleItem(item.screen)}
              >
                <Ionicons name={item.icon} size={20} color={colors.onSurfaceVariant} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: colors.background,
    shadowColor: colors.black,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 16,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  // Profile
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onSurface,
  },
  profileSub: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: colors.outlineVariant + '50',
    marginBottom: spacing.sm,
  },

  // Menu
  menuList: {
    flex: 1,
    gap: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
  },
  menuLabelActive: {
    color: colors.primaryContainer,
    fontWeight: '600',
  },

  // Bottom
  bottomMenu: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
})
