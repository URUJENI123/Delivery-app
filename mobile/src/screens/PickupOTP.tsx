import { useState, useRef, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'
import { colors, spacing, borderRadius, typography } from '../theme'

type Props = NativeStackScreenProps<RootStackParamList, 'PickupOTP'>

const OTP_LENGTH = 6
const RESEND_SECONDS = 60

export function PickupOTP({ navigation, route }: Props) {
  const { phone, deliveryId } = route.params

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [countdown, setCountdown] = useState(RESEND_SECONDS)
  const [canResend, setCanResend] = useState(false)

  const inputRefs = useRef<(TextInput | null)[]>([])

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true)
      return
    }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [countdown])

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const handleDigitChange = useCallback(
    (text: string, index: number) => {
      // Handle paste of full OTP
      if (text.length === OTP_LENGTH) {
        const pasted = text.slice(0, OTP_LENGTH).split('')
        setDigits(pasted)
        inputRefs.current[OTP_LENGTH - 1]?.focus()
        setFocusedIndex(OTP_LENGTH - 1)
        return
      }

      const char = text.slice(-1) // only last char
      const next = [...digits]
      next[index] = char

      setDigits(next)

      if (char && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus()
        setFocusedIndex(index + 1)
      }
    },
    [digits],
  )

  const handleKeyPress = useCallback(
    (key: string, index: number) => {
      if (key === 'Backspace') {
        if (digits[index]) {
          // Clear current box
          const next = [...digits]
          next[index] = ''
          setDigits(next)
        } else if (index > 0) {
          // Move back and clear previous
          const next = [...digits]
          next[index - 1] = ''
          setDigits(next)
          inputRefs.current[index - 1]?.focus()
          setFocusedIndex(index - 1)
        }
      }
    },
    [digits],
  )

  const handleResend = () => {
    if (!canResend) return
    setDigits(Array(OTP_LENGTH).fill(''))
    setCountdown(RESEND_SECONDS)
    setCanResend(false)
    inputRefs.current[0]?.focus()
    setFocusedIndex(0)
    // TODO: call POST /deliveries/:deliveryId/resend-pickup-otp
  }

  const handleVerify = () => {
    const code = digits.join('')
    if (code.length < OTP_LENGTH) return
    Keyboard.dismiss()
    // TODO: call POST /deliveries/:deliveryId/verify-pickup-otp with { otp: code }
    // Navigate back to courier dashboard after successful pickup verification
    navigation.reset({ index: 0, routes: [{ name: 'CourierDashboard' }] })
  }

  const isFilled = digits.join('').length === OTP_LENGTH

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Pickup Verification</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Logo */}
      <View style={styles.logoWrap}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.heading}>Verification Code</Text>
        <Text style={styles.subtext}>
          Enter the 6-digit code sent to{' '}
          <Text style={styles.phoneHighlight}>{phone ?? '+250 78X XXX XXX'}</Text>
          {' '}for pickup verification.
        </Text>

        {/* OTP boxes */}
        <View style={styles.otpRow}>
          {Array.from({ length: OTP_LENGTH }).map((_, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={1}
              onPress={() => {
                inputRefs.current[i]?.focus()
                setFocusedIndex(i)
              }}
            >
              <View
                style={[
                  styles.otpBox,
                  focusedIndex === i ? styles.otpBoxFocused : undefined,
                  digits[i] ? styles.otpBoxFilled : undefined,
                ]}
              >
                <TextInput
                  ref={(r) => { inputRefs.current[i] = r }}
                  style={styles.otpInput}
                  value={digits[i]}
                  onChangeText={(t) => handleDigitChange(t, i)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                  onFocus={() => setFocusedIndex(i)}
                  keyboardType="number-pad"
                  maxLength={OTP_LENGTH}
                  caretHidden
                  textAlign="center"
                  selectTextOnFocus
                />
                {/* Dot placeholder when empty */}
                {!digits[i] && (
                  <View style={styles.dotPlaceholder} pointerEvents="none" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Resend row */}
        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Didn't receive the code? </Text>
          <TouchableOpacity onPress={handleResend} disabled={!canResend}>
            <Text style={[styles.resendLink, !canResend ? styles.resendLinkDisabled : undefined]}>
              Resend Code
            </Text>
          </TouchableOpacity>
        </View>

        {/* Countdown */}
        {!canResend && (
          <View style={styles.countdownBadge}>
            <Ionicons name="time-outline" size={14} color={colors.onSurfaceVariant} />
            <Text style={styles.countdownText}>{formatTime(countdown)}</Text>
          </View>
        )}
      </View>

      {/* Footer — lifts with keyboard */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleVerify}
          disabled={!isFilled}
          activeOpacity={0.85}
          style={[styles.verifyBtn, !isFilled ? styles.verifyBtnDisabled : undefined]}
        >
          <Text style={styles.verifyBtnText}>Verify Pickup</Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.white}
          />
        </TouchableOpacity>

        <Text style={styles.footerHint}>
          By entering the code, you confirm the package{'\n'}
          is in your possession and meets {'\n'}
          safety standards.
        </Text>
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
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    ...typography.labelMd,
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },

  // Logo
  logoWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 60,
  },

  // Body
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  subtext: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    lineHeight: 24,
    marginTop: -spacing.sm,
  },
  phoneHighlight: {
    color: colors.primary,
    fontWeight: '600',
  },

  // OTP
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  otpBox: {
    width: 52,
    height: 60,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  otpBoxFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.surfaceContainer,
  },
  otpBoxFilled: {
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerHigh,
  },
  otpInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    color: colors.onSurface,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
  dotPlaceholder: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.outlineVariant,
  },

  // Resend
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendLabel: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  resendLink: {
    ...typography.bodyMd,
    color: colors.primary,
    fontWeight: '700',
  },
  resendLinkDisabled: {
    color: colors.outlineVariant,
  },

  // Countdown
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    alignSelf: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  countdownText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    fontVariant: ['tabular-nums'],
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  verifyBtn: {
    height: 56,
    borderRadius: borderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryContainer,
  },
  verifyBtnDisabled: {
    opacity: 0.6,
  },
  verifyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.3,
  },
  footerHint: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 18,
  },
})
