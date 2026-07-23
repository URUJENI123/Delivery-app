import { View, StyleSheet } from 'react-native'
import { colors, borderRadius } from '../theme'

interface ProgressIndicatorProps {
  totalSteps: number
  currentStep: number
}

export function ProgressIndicator({ totalSteps, currentStep }: ProgressIndicatorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.track}>
        {Array.from({ length: totalSteps }).map((_, i) => {
          const step = i + 1
          const isCompleted = step < currentStep
          const isCurrent = step === currentStep
          return (
            <View
              key={i}
              style={[
                styles.dot,
                isCompleted ? styles.completed : undefined,
                isCurrent ? styles.current : undefined,
              ]}
            />
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
    backgroundColor: colors.border,
  },
  completed: {
    backgroundColor: colors.deepRed,
  },
  current: {
    backgroundColor: colors.deepRed,
    width: 32,
    height: 10,
    borderRadius: borderRadius.full,
  },
})
