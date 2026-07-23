import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, spacing } from '../theme'
import type { RootTabParamList } from '../types'
import { SenderDashboard } from '../screens/SenderDashboard'
import { JobsScreen } from '../screens/tabs/JobsScreen'
import { OrderHistory } from '../screens/OrderHistory'
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
  { key: 'Dashboard',  label: 'Dashboard',  icon: 'grid-outline',      activeIcon: 'grid' },
  { key: 'Jobs',       label: 'Send',        icon: 'bicycle-outline',   activeIcon: 'bicycle' },
  { key: 'Deliveries', label: 'Orders',      icon: 'archive-outline',   activeIcon: 'archive' },
  { key: 'Messages',   label: 'Messages',    icon: 'chatbox-outline',   activeIcon: 'chatbox' },
  { key: 'Profile',    label: 'Profile',     icon: 'person-outline',    activeIcon: 'person' },
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

export function SenderTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="Dashboard"
    >
      <Tab.Screen name="Dashboard"  component={SenderDashboard} />
      <Tab.Screen name="Jobs"       component={JobsScreen} />
      <Tab.Screen name="Deliveries" component={OrderHistory} />
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
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabItem: { alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 4 },
  label: { fontSize: 10, fontWeight: '500', color: colors.onSurfaceVariant },
  labelActive: { color: colors.primary, fontWeight: '700' },
})
