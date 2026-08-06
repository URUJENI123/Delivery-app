import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../theme'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>

export function SplashScreen({ navigation }: Props) {
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start()

    const timer = setTimeout(() => {
      navigation.replace('Login')
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.atmosphere}>
        <View style={[styles.divider, styles.divider1]} />
        <View style={[styles.divider, styles.divider2]} />
        <View style={[styles.divider, styles.divider3]} />
      </View>

      <Animated.View style={[styles.centerContent, { opacity: opacity as any }]}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.logoText}>PREMIUM LOGISTICS</Text>
      </Animated.View>

      <View style={styles.loadingContainer}>
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkEspresso,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 151.67,
    paddingBottom: 80,
    paddingHorizontal: 24,
  },
  atmosphere: {
    ...StyleSheet.absoluteFill,
  },
  divider: {
    height: 1,
    position: 'absolute',
    backgroundColor: colors.accentPeach,
    opacity: 0.15,
  },
  divider1: { top: 177, left: -50, width: 200 },
  divider2: { top: 442, left: 140, width: 300 },
  divider3: { top: 707, left: 39, width: 150 },
  centerContent: {
    alignItems: 'center',
    gap: 24,
  },
  logo: {
    width: 220,
    height: 120,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#A68A88',
    letterSpacing: 4,
    textAlign: 'center',
  },
  loadingContainer: {
    width: 320,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 12,
    backgroundColor: colors.accentPeach,
  },
})
