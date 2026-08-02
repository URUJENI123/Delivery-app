import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, spacing, typography } from '../theme'
import type { RootTabParamList } from '../types'
import { SenderDashboard } from '../screens/SenderDashboard'
import { CourierDashboard } from '../screens/CourierDashboard'
import { JobsScreen } from '../screens/tabs/JobsScreen'
import { DeliveriesScreen } from '../screens/tabs/DeliveriesScreen'
import { MessagesScreen } from '../screens/tabs/MessagesScreen'
import { ProfileScreen } from '../screens/tabs/ProfileScreen'

const Tab = createBottomTabNavigator<RootTabParamList>()

interface TabConfig {
  key: keyof RootTabParamList
  label: string
  icon: keyof typeof Ionicons.glyphMap
  activeIcon: keyof typeof Ionicons.glyphMap
}

const tabs: TabConfig[] = [
  { key: 'Dashboard', label: 'Dashboard', icon: 'grid-outline',       activeIcon: 'grid' },
  { key: 'Jobs',      label: 'Send',       icon: 'bicycle-outline',    activeIcon: 'bicycle' },
  { key: 'Deliveries',label: 'Deliveries', icon: 'archive-outline',    activeIcon: 'archive' },
  { key: 'Messages',  label: 'Messages',   icon: 'chatbox-outline',    activeIcon: 'chatbox' },
  { key: 'Profile',   label: 'Profile',    icon: 'person-outline',     activeIcon: 'person' },
]

function TabBar({ state, navigation: tabNavigation }: any) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || spacing.sm }]}>
      {tabs.map((tab, index) => {
        const isActive = state.index === index
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => tabNavigation.navigate(tab.key)}
            style={styles.tab}
            activeOpacity={0.7}
          >
            {isActive ? (
              <View style={styles.inactiveTab}>
                <Ionicons name={tab.activeIcon} size={22} color={colors.primary} />
                <Text style={[styles.inactiveLabel, { color: colors.primary }]}>{tab.label}</Text>
              </View>
            ) : (
              <View style={styles.inactiveTab}>
                <Ionicons name={tab.icon} size={22} color={colors.onSurfaceVariant} />
                <Text style={styles.inactiveLabel}>{tab.label}</Text>
              </View>
            )}
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="Dashboard"
    >
      <Tab.Screen name="Dashboard"  component={SenderDashboard} />
      <Tab.Screen name="Jobs"       component={JobsScreen} />
      <Tab.Screen name="Deliveries" component={DeliveriesScreen} />
      <Tab.Screen name="Messages"   component={MessagesScreen} />
      <Tab.Screen name="Profile"    component={ProfileScreen} />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.darkCharcoal,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveTab: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  inactiveLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
  },
})
