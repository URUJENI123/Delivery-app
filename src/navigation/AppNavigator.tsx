import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'
import { SplashScreen } from '../screens/SplashScreen'
import { LoginScreen } from '../screens/LoginScreen'
import { DeliveryLanding } from '../screens/DeliveryLanding'
import { LiveTracking } from '../screens/LiveTracking'
import { CourierOnboardingStep1 } from '../screens/CourierOnboardingStep1'
import { CourierOnboardingStep2 } from '../screens/CourierOnboardingStep2'
import { CourierOnboardingStep3 } from '../screens/CourierOnboardingStep3'
import { PendingApproval } from '../screens/PendingApproval'
import { SendPackage } from '../screens/SendPackage'
import { PackageDetails } from '../screens/PackageDetails'
import { OrderHistory } from '../screens/OrderHistory'
import { Wallet } from '../screens/Wallet'
import { ConfirmWithdraw } from '../screens/ConfirmWithdraw'
import { WithdrawSuccess } from '../screens/WithdrawSuccess'
import { VehicleManagement } from '../screens/VehicleManagement'
import { Support } from '../screens/Support'
import { ChatScreen } from '../screens/ChatScreen'
import { PersonalDetails } from '../screens/PersonalDetails'
import { PickupOTP } from '../screens/PickupOTP'
import { DeliveryInfoScreen } from '../screens/DeliveryInfoScreen'
import { JobsMapScreen } from '../screens/JobsMapScreen'
import { PaymentMethod } from '../screens/PaymentMethod'
import { Notifications } from '../screens/Notifications'
import { DeliveriesMapScreen } from '../screens/DeliveriesMapScreen'
import { SettingsScreen } from '../screens/SettingsScreen'
import { SenderTabNavigator } from './SenderTabNavigator'
import { CourierTabNavigator } from './CourierTabNavigator'

const Stack = createNativeStackNavigator<RootStackParamList>()

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#1B1110' },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="DeliveryLanding" component={DeliveryLanding} />
        {/* Sender flow */}
        <Stack.Screen name="SenderDashboard" component={SenderTabNavigator} />
        <Stack.Screen name="SendPackage" component={SendPackage} />
        <Stack.Screen name="PackageDetails" component={PackageDetails} />
        <Stack.Screen name="OrderHistory" component={OrderHistory} />
        {/* Courier flow */}
        <Stack.Screen name="CourierDashboard" component={CourierTabNavigator} />
        <Stack.Screen name="CourierOnboardingStep1" component={CourierOnboardingStep1} />
        <Stack.Screen name="CourierOnboardingStep2" component={CourierOnboardingStep2} />
        <Stack.Screen name="CourierOnboardingStep3" component={CourierOnboardingStep3} />
        <Stack.Screen name="PendingApproval" component={PendingApproval} />
        {/* Shared */}
        <Stack.Screen name="LiveTracking" component={LiveTracking} />
        <Stack.Screen name="Wallet" component={Wallet} />
        <Stack.Screen name="ConfirmWithdraw" component={ConfirmWithdraw} />
        <Stack.Screen name="WithdrawSuccess" component={WithdrawSuccess} />
        <Stack.Screen name="VehicleManagement" component={VehicleManagement} />
        <Stack.Screen name="Support" component={Support} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="PersonalDetails" component={PersonalDetails} />
        <Stack.Screen name="PickupOTP" component={PickupOTP} />
        <Stack.Screen name="DeliveryInfo" component={DeliveryInfoScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="JobsMap" component={JobsMapScreen} />
        <Stack.Screen name="PaymentMethod" component={PaymentMethod} />
        <Stack.Screen name="Notifications" component={Notifications} />
        <Stack.Screen name="DeliveriesMap" component={DeliveriesMapScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
