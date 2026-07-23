import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing, borderRadius, typography } from '../theme'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'

type Props = NativeStackScreenProps<RootStackParamList, 'CourierOnboardingStep1'>

export function CourierOnboardingStep1({ navigation, route }: Props) {
  const isSender = (route?.params as any)?.isSender ?? false
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress section */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.registrationTitle}>{isSender ? 'SIGN UP' : 'REGISTRATION'}</Text>
              <Text style={styles.stepLabel}>{isSender ? 'Step 1 of 1' : 'Step 1 of 3'}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>

          {/* Form card */}
          <View style={styles.formCard}>
            {/* Card header */}
            <View style={styles.formCardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="person-outline" size={20} color={colors.onPrimaryContainer} />
              </View>
              <View>
                <Text style={styles.formTitle}>Personal Details</Text>
                <Text style={styles.formSubtitle}>Tell us who you are</Text>
              </View>
            </View>

            {/* Fields */}
            <View style={styles.formFields}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Kamanzi John"
                  placeholderTextColor={colors.outlineVariant}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="kamanzi.j@kigalilogistics.com"
                  placeholderTextColor={colors.outlineVariant}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <View style={styles.phoneWrapper}>
                  <View style={styles.phonePrefix}>
                    <Text style={styles.phonePrefixText}>+250</Text>
                  </View>
                  <View style={styles.phoneDivider} />
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="788 000 000"
                    placeholderTextColor={colors.outlineVariant}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Create Password</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••"
                    placeholderTextColor={colors.outlineVariant}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.passwordHint}>
                  Must be at least 8 characters with one uppercase letter and a symbol.
                </Text>
              </View>
            </View>

            {/* Trust badge */}
            <View style={styles.trustBadge}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.onSurfaceVariant} />
              <Text style={styles.trustText}>End-to-end encrypted data protection</Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => isSender
              ? navigation.reset({ index: 0, routes: [{ name: 'SenderDashboard' }] })
              : navigation.navigate('CourierOnboardingStep2')
            }
            activeOpacity={0.85}
          >
            <Text style={styles.nextButtonText}>{isSender ? 'CREATE ACCOUNT' : 'NEXT STEP'}</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.loginRow}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginText}>
              Already have an account?{' '}
              <Text style={styles.loginLink}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },

  // Top bar
  topBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Progress
  progressSection: {
    marginBottom: spacing.xl,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  registrationTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.onSurface,
    letterSpacing: 0.5,
  },
  stepLabel: {
    ...typography.labelMd,
    color: colors.primary,
  },
  progressTrack: {
    height: 4,
    width: '100%',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    width: '33%',
    height: '100%',
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.full,
  },

  // Form card
  formCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  formCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.onSurface,
  },
  formSubtitle: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },

  // Fields
  formFields: {
    gap: spacing.md,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  input: {
    height: 48,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    color: colors.onSurface,
    fontSize: 15,
  },
  phoneWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  phonePrefix: {
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    height: '100%',
  },
  phonePrefixText: {
    fontSize: 15,
    color: colors.onSurface,
    fontWeight: '500',
  },
  phoneDivider: {
    width: 1,
    height: '60%',
    backgroundColor: colors.outlineVariant,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    color: colors.onSurface,
    fontSize: 15,
    height: '100%',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.lg,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    color: colors.onSurface,
    fontSize: 15,
    height: '100%',
  },
  eyeBtn: {
    paddingHorizontal: spacing.md,
    height: '100%',
    justifyContent: 'center',
  },
  passwordHint: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.onSurfaceVariant,
    opacity: 0.8,
  },

  // Trust badge
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.lg,
  },
  trustText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant + '30',
  },
  nextButton: {
    height: 52,
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 1,
  },
  loginRow: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  loginText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  loginLink: {
    color: colors.primary,
    fontWeight: '600',
  },
})
