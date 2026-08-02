import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, spacing } from '../theme'
import type { CourierTabParamList } from '../types'
import { CourierDashboard } from '../screens/CourierDashboard'
import { MessagesScreen } from '../screens/tabs/MessagesScreen'
import { ProfileScreen } from '../screens/tabs/ProfileScreen'
import { DeliveriesScreen } from '../screens/tabs/DeliveriesScreen'
import { JobsScreen } from '../screens/tabs/JobsScreen'

const Tab = createBottomTabNavigator<CourierTabParamList>()

interface TabConfig {
  key: keyof CourierTabParamList
  label: string
  icon: keyof typeof Ionicons.glyphMap
  activeIcon: keyof typeof Ionicons.glyphMap
}

const tabs: TabConfig[] = [
  { key: 'CourierHome',     label: 'Dashboard', icon: 'grid-outline',       activeIcon: 'grid' },
  { key: 'CourierJobs',     label: 'Jobs',       icon: 'bicycle-outline',   activeIcon: 'bicycle' },
  { key: 'CourierOrders',   label: 'Deliveries', icon: 'archive-outline',   activeIcon: 'archive' },
  { key: 'CourierMessages', label: 'Messages',   icon: 'chatbox-outline',   activeIcon: 'chatbox' },
  { key: 'CourierProfile',  label: 'Profile',    icon: 'person-outline',    activeIcon: 'person' },
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
            <View style={styles.tabItem}>
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={22}
                color={isActive ? colors.primary : colors.onSurfaceVariant}
              />
              <Text style={[styles.label, isActive ? styles.labelActive : undefined]}>
                {tab.label}
              </Text>
            </View>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

export function CourierTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="CourierHome"
    >
      <Tab.Screen name="CourierHome"     component={CourierDashboard} />
      <Tab.Screen name="CourierJobs"     component={JobsScreen} initialParams={{ isCourier: true }} />
      <Tab.Screen name="CourierOrders"   component={DeliveriesScreen} />
      <Tab.Screen name="CourierMessages" component={MessagesScreen} />
      <Tab.Screen name="CourierProfile"  component={ProfileScreen} initialParams={{ isCourier: true }} />
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
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabItem: { alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 4 },
  label: { fontSize: 10, fontWeight: '500', color: colors.onSurfaceVariant },
  labelActive: { color: colors.primary, fontWeight: '700' },
})
