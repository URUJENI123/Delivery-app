import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, borderRadius } from '../theme'

interface TopAppBarProps {
  onBack?: () => void
  rightIcon?: keyof typeof Ionicons.glyphMap
  onRightPress?: () => void
  showBorder?: boolean
}

export function TopAppBar({ onBack, rightIcon, onRightPress, showBorder }: TopAppBarProps) {
  return (
    <View style={[styles.container, showBorder ? styles.withBorder : undefined]}>
      <View style={styles.left}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.white} />
          </TouchableOpacity>
        ) : null}
      </View>
      {rightIcon ? (
        <TouchableOpacity onPress={onRightPress} style={styles.rightBtn}>
          <Ionicons name={rightIcon} size={20} color={colors.white} />
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.darkEspresso,
  },
  withBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.overlayRed,
    borderWidth: 2,
    borderColor: colors.overlayRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
