import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'
import { colors, spacing, borderRadius } from '../theme'

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>

export function LoginScreen({ navigation }: Props) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoArea}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Hero */}
          <View style={styles.heroArea}>
            <Text style={styles.heroTitle}>DELIVERY</Text>
            <Text style={styles.heroSubtitle}>Urban authority. Precision speed.</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email / Phone */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>EMAIL OR PHONE NUMBER</Text>
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={20} color={colors.onSurfaceVariant} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., driver@delivery.com"
                  placeholderTextColor="#5A3F3D"
                  value={identifier}
                  onChangeText={setIdentifier}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldBlock}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <TouchableOpacity>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.onSurfaceVariant} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#5A3F3D"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* LOG IN button */}
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => navigation.navigate('SenderDashboard')}
              activeOpacity={0.85}
            >
              <Text style={styles.loginBtnText}>LOG IN</Text>
            </TouchableOpacity>

            {/* OR divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign up */}
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>New courier? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('CourierOnboardingStep1')}>
                <Text style={styles.signupLink}>Register here</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>New sender? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('CourierOnboardingStep1', { isSender: true })}>
                <Text style={styles.signupLink}>Create account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 48,
  },

  logoArea: { alignItems: 'center', marginBottom: 32 },
  logoImage: { width: 160, height: 70 },

  heroArea: { alignItems: 'center', marginBottom: 40, gap: spacing.sm },
  heroTitle: { fontSize: 44, fontWeight: '800', color: colors.primary, letterSpacing: 3 },
  heroSubtitle: { fontSize: 16, fontWeight: '400', color: colors.onSurfaceVariant, textAlign: 'center' },

  form: { width: '100%', gap: 20 },

  fieldBlock: { gap: spacing.sm },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.onSurface, letterSpacing: 1 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1C1110', borderWidth: 1, borderColor: '#3A2422',
    borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, height: 56,
  },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, color: colors.onSurface, fontSize: 16 },
  eyeBtn: { padding: spacing.xs, marginLeft: spacing.xs },
  passwordLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forgotText: { fontSize: 13, fontWeight: '500', color: colors.primaryContainer },

  // LOG IN button
  loginBtn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 2,
  },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#2A1A18' },
  dividerText: { fontSize: 13, fontWeight: '600', color: colors.onSurfaceVariant, letterSpacing: 2 },

  signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signupText: { fontSize: 15, color: colors.onSurfaceVariant },
  signupLink: { fontSize: 15, fontWeight: '600', color: colors.primaryContainer },
})
