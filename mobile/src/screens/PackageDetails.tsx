import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'
import { colors, spacing, borderRadius, typography } from '../theme'

type Props = NativeStackScreenProps<RootStackParamList, 'PackageDetails'>

export function PackageDetails({ navigation }: Props) {
  const [description, setDescription] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [weight, setWeight] = useState(5)
  const [loading, setLoading] = useState(false)

  function handleConfirm() {
    setLoading(true)
    // Simulate broadcasting to nearby couriers
    setTimeout(() => {
      setLoading(false)
      navigation.navigate('PaymentMethod')
    }, 1500)
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Step indicator */}
        <View style={styles.stepRow}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={[styles.stepBar, s <= 2 ? styles.stepBarActive : undefined]} />
          ))}
          <Text style={styles.stepLabel}>Step 2 of 3</Text>
        </View>

        <Text style={styles.title}>Package Details</Text>
        <Text style={styles.subtitle}>Provide info about your item for accurate courier assignment.</Text>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>ITEM DESCRIPTION</Text>
          <TextInput
            style={styles.textarea}
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Fresh vegetables, electronics boxes..."
            placeholderTextColor={colors.outlineVariant}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Recipient */}
        <View style={styles.twoCol}>
          <View style={[styles.fieldGroup, styles.flex1]}>
            <Text style={styles.fieldLabel}>RECIPIENT NAME</Text>
            <TextInput
              style={styles.input}
              value={recipientName}
              onChangeText={setRecipientName}
              placeholder="Full name"
              placeholderTextColor={colors.outlineVariant}
            />
          </View>
          <View style={[styles.fieldGroup, styles.flex1]}>
            <Text style={styles.fieldLabel}>RECIPIENT PHONE</Text>
            <View style={styles.phoneRow}>
              <Text style={styles.phonePrefix}>+250</Text>
              <TextInput
                style={styles.phoneInput}
                value={recipientPhone}
                onChangeText={setRecipientPhone}
                placeholder="780 000 000"
                placeholderTextColor={colors.outlineVariant}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Weight slider */}
        <View style={styles.weightCard}>
          <View style={styles.weightHeader}>
            <Text style={styles.weightLabel}>Estimated Weight</Text>
            <Text style={styles.weightValue}>{weight.toFixed(1)} kg</Text>
          </View>
          {/* Manual weight buttons since Slider isn't in RN core */}
          <View style={styles.weightButtons}>
            {[0.5, 1, 2, 5, 10, 15, 20].map((w) => (
              <TouchableOpacity
                key={w}
                style={[styles.weightBtn, weight === w ? styles.weightBtnActive : undefined]}
                onPress={() => setWeight(w)}
              >
                <Text style={[styles.weightBtnText, weight === w ? styles.weightBtnTextActive : undefined]}>
                  {w}kg
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Image placeholder */}
        <View style={styles.imageBanner}>
          <View style={styles.imageBannerOverlay} />
          <View style={styles.secureBadge}>
            <Ionicons name="shield-checkmark" size={14} color={colors.onPrimary} />
            <Text style={styles.secureBadgeText}>Secure Handling</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.confirmBtn, loading ? styles.confirmBtnLoading : undefined]} onPress={handleConfirm} activeOpacity={0.85} disabled={loading}>
          {loading ? (
            <>
              <ActivityIndicator size="small" color={colors.onPrimary} />
              <Text style={styles.confirmBtnText}>Finding Courier...</Text>
            </>
          ) : (
            <>
              <Text style={styles.confirmBtnText}>Confirm & Find Courier</Text>
              <Ionicons name="search" size={18} color={colors.onPrimary} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  topBar: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.primary, letterSpacing: -0.5 },

  content: { paddingHorizontal: spacing.lg, paddingBottom: 120, gap: spacing.lg },

  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepBar: { width: 48, height: 4, borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainerHigh },
  stepBarActive: { backgroundColor: colors.primary },
  stepLabel: { marginLeft: 'auto', fontSize: 13, fontWeight: '600', color: colors.onSurfaceVariant },

  title: { fontSize: 22, fontWeight: '600', color: colors.onSurface },
  subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant },

  fieldGroup: { gap: spacing.xs },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { height: 48, backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.outlineVariant, paddingHorizontal: spacing.md, color: colors.onSurface, fontSize: 14 },
  textarea: { backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.outlineVariant, padding: spacing.md, color: colors.onSurface, fontSize: 14, minHeight: 80 },

  twoCol: { flexDirection: 'row', gap: spacing.md },
  flex1: { flex: 1 },
  phoneRow: { height: 48, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.outlineVariant, overflow: 'hidden' },
  phonePrefix: { paddingHorizontal: spacing.sm, fontSize: 13, fontWeight: '600', color: colors.onSurface },
  phoneInput: { flex: 1, color: colors.onSurface, fontSize: 14, height: '100%' },

  weightCard: { backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.outlineVariant, padding: spacing.lg, gap: spacing.md },
  weightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weightLabel: { fontSize: 13, fontWeight: '600', color: colors.onSurface },
  weightValue: { fontSize: 18, fontWeight: '600', color: colors.primary },
  weightButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  weightBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerHigh },
  weightBtnActive: { borderColor: colors.primaryContainer, backgroundColor: 'rgba(137,32,32,0.2)' },
  weightBtnText: { fontSize: 12, color: colors.onSurfaceVariant },
  weightBtnTextActive: { color: colors.primary, fontWeight: '700' },

  imageBanner: { height: 160, borderRadius: borderRadius.xl, overflow: 'hidden', backgroundColor: colors.surfaceContainerHigh, position: 'relative', justifyContent: 'flex-end', padding: spacing.md },
  imageBannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(27,17,16,0.5)' },
  secureBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.primaryContainer, alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full },
  secureBadgeText: { fontSize: 12, fontWeight: '600', color: colors.onPrimary },

  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.outlineVariant, backgroundColor: colors.surfaceContainer, gap: spacing.md },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeSubLabel: { fontSize: 11, fontWeight: '600', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  feeValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  feeValue: { fontSize: 28, fontWeight: '700', color: colors.onSurface },
  feeCurrency: { fontSize: 16, fontWeight: '600', color: colors.primary },
  insuranceNote: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  insuranceText: { fontSize: 11, color: colors.onSurfaceVariant, fontStyle: 'italic' },
  confirmBtn: { height: 48, backgroundColor: colors.primaryContainer, borderRadius: borderRadius.full, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  confirmBtnLoading: { opacity: 0.75 },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: colors.white, letterSpacing: 0.5, textTransform: 'uppercase' },
})
