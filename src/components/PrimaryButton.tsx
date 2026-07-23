import { TouchableOpacity, Text, StyleSheet, type ViewStyle } from 'react-native'
import { colors, borderRadius, typography } from '../theme'

interface PrimaryButtonProps {
  title: string
  onPress: () => void
  style?: ViewStyle
}

export function PrimaryButton({ title, onPress, style }: PrimaryButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.button, style]} activeOpacity={0.9}>
      <Text style={styles.label}>{title}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    height: 60,
    backgroundColor: colors.deepRed,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    elevation: 6,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    color: colors.white,
  },
})
