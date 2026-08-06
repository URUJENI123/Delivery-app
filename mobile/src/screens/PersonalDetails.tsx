import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'
import { colors, spacing, borderRadius, typography } from '../theme'

type Props = NativeStackScreenProps<RootStackParamList, 'PersonalDetails'>

export function PersonalDetails({ navigation }: Props) {
  const [photo, setPhoto] = useState<string | null>(null)
  const [fullName, setFullName] = useState('Amani Karangwa')
  const [email, setEmail] = useState('amani@velocity.rw')
  const [phone, setPhone] = useState('788000000')
  const [address, setAddress] = useState('KN 2 Rd, Nyarugenge, Kigali')

  async function handleChangePhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Photo library access is needed.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1] as [number, number],
      quality: 0.8,
    })
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri)
    }
  }

  function handleSave() {
    Alert.alert('Saved', 'Your personal details have been updated.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ])
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="settings-outline" size={22} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Edit Personal Info</Text>
          <Text style={styles.subtitle}>
            Keep your courier profile up to date for better logistics coordination.
          </Text>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={handleChangePhoto} style={styles.avatarWrap}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.avatar} />
              ) : (
                <Image
                  source={{ uri: 'https://i.pravatar.cc/200?img=15' }}
                  style={styles.avatar}
                />
              )}
              <View style={styles.editBadge}>
                <Ionicons name="pencil" size={14} color={colors.white} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleChangePhoto}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Fields */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={18} color={colors.onSurfaceVariant} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholderTextColor={colors.outlineVariant}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={colors.onSurfaceVariant} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholderTextColor={colors.outlineVariant}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <View style={styles.inputRow}>
              <Ionicons name="call-outline" size={18} color={colors.onSurfaceVariant} style={styles.inputIcon} />
              <View style={styles.phonePrefix}>
                <Text style={styles.phonePrefixText}>+250</Text>
              </View>
              <View style={styles.phoneDivider} />
              <TextInput
                style={[styles.input, { paddingLeft: spacing.sm }]}
                value={phone}
                onChangeText={setPhone}
                placeholderTextColor={colors.outlineVariant}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Residential Address</Text>
            <View style={styles.inputRow}>
              <Ionicons name="location-outline" size={18} color={colors.onSurfaceVariant} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholderTextColor={colors.outlineVariant}
              />
            </View>
          </View>
        </ScrollView>

        {/* Save button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  topBar: {
    height: 52, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: spacing.md,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.primary },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 32, gap: spacing.lg },
  title: { fontSize: 24, fontWeight: '800', color: colors.onSurface },
  subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, lineHeight: 22, marginTop: -spacing.sm },
  avatarSection: { alignItems: 'center', gap: spacing.sm },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 100, height: 100, borderRadius: 16,
    borderWidth: 2, borderColor: colors.primaryContainer,
  },
  editBadge: {
    position: 'absolute', bottom: 6, right: 6,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primaryContainer,
    borderWidth: 2, borderColor: colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  changePhotoText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  fieldGroup: { gap: spacing.xs },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: colors.onSurface },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    height: 52, backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.md,
  },
  inputIcon: { marginRight: spacing.sm, flexShrink: 0 },
  input: { flex: 1, color: colors.onSurface, fontSize: 15 },
  phonePrefix: { paddingRight: spacing.sm },
  phonePrefixText: { fontSize: 15, color: colors.onSurface, fontWeight: '500' },
  phoneDivider: { width: 1, height: 24, backgroundColor: colors.outlineVariant, marginRight: spacing.sm },
  footer: {
    paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm,
  },
  saveBtn: {
    height: 52, backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.xl, alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },
})
