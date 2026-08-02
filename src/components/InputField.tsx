import { View, Text, TextInput, StyleSheet } from 'react-native'
import { colors, borderRadius, spacing, typography } from '../theme'

interface InputFieldProps {
  label: string
  placeholder?: string
  value: string
  onChangeText: (text: string) => void
  keyboardType?: 'default' | 'numeric' | 'email-address'
}

export function InputField({ label, placeholder, value, onChangeText, keyboardType }: InputFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.border}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.border,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    color: colors.white,
    ...typography.body,
  },
})
