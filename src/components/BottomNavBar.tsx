import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, borderRadius, spacing, typography } from '../theme'

interface Tab {
  key: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
  activeIcon: keyof typeof Ionicons.glyphMap
}

const tabs: Tab[] = [
  { key: 'Dashboard', label: 'Dashboard', icon: 'grid-outline', activeIcon: 'grid' },
  { key: 'Send', label: 'Send', icon: 'paper-plane-outline', activeIcon: 'paper-plane' },
  { key: 'Deliveries', label: 'Deliveries', icon: 'cube-outline', activeIcon: 'cube' },
  { key: 'Messages', label: 'Messages', icon: 'chatbubble-outline', activeIcon: 'chatbubble' },
  { key: 'Profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
]

interface BottomNavBarProps {
  activeTab: string
  onTabPress: (key: string) => void
}

export function BottomNavBar({ activeTab, onTabPress }: BottomNavBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.shadow} />
      <View style={styles.inner}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab
          return (
            <TouchableOpacity key={tab.key} onPress={() => onTabPress(tab.key)} style={styles.tab}>
              {isActive ? (
                <View style={styles.activeTab}>
                  <Ionicons name={tab.activeIcon} size={18} color={colors.white} />
                  {tab.label ? <Text style={styles.activeLabel}>{tab.label}</Text> : null}
                </View>
              ) : (
                <View style={styles.inactiveTab}>
                  <Ionicons name={tab.icon} size={22} color={colors.border} />
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 59,
    width: '100%',
    backgroundColor: colors.darkCharcoal,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  shadow: {
    ...StyleSheet.absoluteFill,
    elevation: 6,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: 16.3,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
    height: 42,
  },
  activeLabel: {
    ...typography.caption,
    color: colors.white,
  },
  inactiveTab: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
})
