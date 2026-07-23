import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'
import { colors, spacing, borderRadius, typography } from '../theme'

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentMethod'>

type Provider = 'mtn' | 'airtel'

export function PaymentMethod({ navigation }: Props) {
  const [provider, setProvider] = useState<Provider>('mtn')
  const [holderName, setHolderName] = useState('')
  const [phone, setPhone] = useState('')
  const [setPrimary, setSetPrimary] = useState(false)

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Add Payment Method</Text>
        <Text style={styles.subtitle}>
          Link your Mobile Money account for instant, secure transactions in Kigali.
        </Text>

        {/* Provider selection */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>SELECT PROVIDER</Text>
          <View style={styles.providerRow}>
            {/* MTN MoMo */}
            <TouchableOpacity
              style={[styles.providerCard, provider === 'mtn' ? styles.providerCardActive : undefined]}
              onPress={() => setProvider('mtn')}
              activeOpacity={0.8}
            >
              <View style={styles.mtnBadge}>
                <Text style={styles.mtnBadgeText}>MTN</Text>
              </View>
              <Text style={styles.providerName}>MTN MoMo</Text>
            </TouchableOpacity>

            {/* Airtel Money */}
            <TouchableOpacity
              style={[styles.providerCard, provider === 'airtel' ? styles.providerCardActive : undefined]}
              onPress={() => setProvider('airtel')}
              activeOpacity={0.8}
            >
              <View style={styles.airtelBadge}>
                <Text style={styles.airtelBadgeText}>Airtel</Text>
              </View>
              <Text style={styles.providerName}>Airtel Money</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account holder name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>ACCOUNT HOLDER NAME</Text>
          <TextInput
            style={styles.input}
            value={holderName}
            onChangeText={setHolderName}
            placeholder="John Doe"
            placeholderTextColor={colors.outlineVariant}
          />
        </View>

        {/* Phone number */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
          <View style={styles.phoneRow}>
            <View style={styles.phonePrefix}>
              <Text style={styles.phonePrefixText}>+250</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="788 000 000"
              placeholderTextColor={colors.outlineVariant}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Set as primary */}
        <TouchableOpacity
          style={styles.primaryRow}
          onPress={() => setSetPrimary(!setPrimary)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, setPrimary ? styles.checkboxActive : undefined]}>
            {setPrimary && <Ionicons name="checkmark" size={14} color={colors.onPrimary} />}
          </View>
          <Text style={styles.primaryLabel}>Set as Primary Payment Method</Text>
        </TouchableOpacity>

        {/* Security note */}
        <View style={styles.securityNote}>
          <View style={styles.securityIconWrap}>
            <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
          </View>
          <Text style={styles.securityText}>
            Your payment data is encrypted and processed via secure Rwandan financial channels.
          </Text>
        </View>
      </ScrollView>

      {/* Footer button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveBtn}
          activeOpacity={0.85}
          onPress={() => {
            // Simulate a payment attempt (80% success rate)
            const success = Math.random() > 0.2
            if (success) {
              Alert.alert(
                'Payment Successful',
                'Your payment has been processed. Your courier is being assigned.',
                [{ text: 'Continue', onPress: () => navigation.navigate('SenderDashboard') }],
              )
            } else {
              Alert.alert(
                'Payment Failed',
                'We could not process your payment. Please check your account balance and try again.',
                [{ text: 'Try Again' }],
              )
            }
          }}
        >
          <Text style={styles.saveBtnText}>CONFIRM</Text>
          {/* <Ionicons name="arrow-forward" size={18} color={colors.white} /> */}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
    gap: spacing.lg,
  },

  title: { fontSize: 26, fontWeight: '700', color: colors.onSurface },
  subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, lineHeight: 22 },

  fieldGroup: { gap: spacing.sm },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  providerRow: { flexDirection: 'row', gap: spacing.md },
  providerCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  providerCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceContainerHigh,
  },

  mtnBadge: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#FFCC00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mtnBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1A1A1A',
  },

  airtelBadge: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
  },
  airtelBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.white,
  },

  providerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
  },

  input: {
    height: 52,
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.md,
    color: colors.onSurface,
    fontSize: 15,
  },

  phoneRow: {
    height: 52,
    flexDirection: 'row',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainer,
  },
  phonePrefix: {
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.outlineVariant,
  },
  phonePrefixText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.onSurface,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    color: colors.onSurface,
    fontSize: 15,
  },

  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  primaryLabel: {
    fontSize: 14,
    color: colors.onSurface,
  },

  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.md,
  },
  securityIconWrap: {
    marginTop: 2,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
  },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    backgroundColor: colors.background,
  },
  saveBtn: {
    height: 52,
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
})
