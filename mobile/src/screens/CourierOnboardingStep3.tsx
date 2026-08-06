import { useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'
import { colors, spacing, borderRadius, typography } from '../theme'

const SUCCESS_COLOR = '#4CAF50'

type Props = NativeStackScreenProps<RootStackParamList, 'CourierOnboardingStep3'>

export function CourierOnboardingStep3({ navigation }: Props) {
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [selfieUri, setSelfieUri] = useState<string | null>(null)
  const [nationalIdUri, setNationalIdUri] = useState<string | null>(null)
  const [licenseUri, setLicenseUri] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(false)

  const cameraRef = useRef<any>(null)
  const [cameraPermission, requestCameraPermission] = useCameraPermissions()

  async function handleTakePhoto() {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission()
      if (!result.granted) {
        Alert.alert('Permission required', 'Camera access is needed to take a selfie.')
        return
      }
    }
    setShowCamera(true)
  }

  async function handleCameraCapture() {
    try {
      if (!cameraRef.current) return
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 })
      setSelfieUri(photo.uri)
      setShowCamera(false)
    } catch {
      Alert.alert('Error', 'Failed to take photo. Please try again.')
      setShowCamera(false)
    }
  }

  async function handleUpload(type: 'nationalId' | 'license') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Photo library access is needed to upload documents.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3] as [number, number],
      quality: 0.8,
    })
    if (!result.canceled && result.assets[0]) {
      if (type === 'nationalId') setNationalIdUri(result.assets[0].uri)
      else setLicenseUri(result.assets[0].uri)
    }
  }

  function handleSubmit() {
    if (!selfieUri) {
      Alert.alert('Missing selfie', 'Please take a live selfie before submitting.')
      return
    }
    if (!nationalIdUri) {
      Alert.alert('Missing document', 'Please upload your National ID.')
      return
    }
    if (!licenseUri) {
      Alert.alert('Missing document', "Please upload your Driver's License.")
      return
    }
    if (!acceptedTerms) {
      Alert.alert('Terms required', 'Please accept the terms before submitting.')
      return
    }
    navigation.navigate('PendingApproval')
  }

  // Camera overlay
  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing="front" ref={cameraRef} />
        <View style={styles.cameraOverlay}>
          <View style={styles.faceGuide} />
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.cancelCameraButton} onPress={() => setShowCamera(false)}>
              <Ionicons name="close" size={24} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={handleCameraCapture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <View style={{ width: 48 }} />
          </View>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top nav */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <Text style={styles.verificationTitle}>VERIFICATION</Text>
            <View style={styles.progressSegments}>
              <View style={[styles.progressSegment, styles.progressSegmentDone]} />
              <View style={[styles.progressSegment, styles.progressSegmentDone]} />
              <View style={[styles.progressSegment, styles.progressSegmentActive]} />
            </View>
          </View>
          <Text style={styles.subtitle}>
            Step 3 of 3: Secure Document Upload.{'\n'}Ensure photos are clear and legible for instant approval.
          </Text>
        </View>

        {/* Selfie card */}
        <View style={styles.card}>
          <View style={styles.previewArea}>
            {selfieUri
              ? <Image source={{ uri: selfieUri }} style={styles.previewImage} />
              : <View style={styles.selfieIconWrap}><Ionicons name="happy-outline" size={36} color={colors.primary} /></View>
            }
          </View>
          <Text style={styles.cardLabel}>LIVE SELFIE</Text>
          <Text style={styles.cardHint}>Face forward with neutral expression</Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleTakePhoto}>
            <Ionicons name="camera-outline" size={18} color={colors.white} />
            <Text style={styles.actionButtonText}>{selfieUri ? 'RETAKE PHOTO' : 'TAKE PHOTO'}</Text>
          </TouchableOpacity>
        </View>

        {/* National ID card */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.previewArea} onPress={() => handleUpload('nationalId')}>
            {nationalIdUri
              ? <Image source={{ uri: nationalIdUri }} style={styles.previewImage} />
              : <View style={styles.docIconWrap}><Ionicons name="id-card-outline" size={36} color={colors.onSurfaceVariant} /></View>
            }
          </TouchableOpacity>
          <Text style={styles.cardLabel}>NATIONAL ID FRONT</Text>
          <TouchableOpacity style={[styles.uploadButton, nationalIdUri ? styles.uploadButtonDone : undefined]} onPress={() => handleUpload('nationalId')}>
            <Ionicons name={nationalIdUri ? 'checkmark-circle-outline' : 'cloud-upload-outline'} size={16} color={nationalIdUri ? SUCCESS_COLOR : colors.primary} />
            <Text style={[styles.uploadButtonText, nationalIdUri ? styles.uploadButtonTextDone : undefined]}>{nationalIdUri ? 'CHANGE' : 'UPLOAD IMAGE'}</Text>
          </TouchableOpacity>
        </View>

        {/* Driver's License card */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.previewArea} onPress={() => handleUpload('license')}>
            {licenseUri
              ? <Image source={{ uri: licenseUri }} style={styles.previewImage} />
              : <View style={styles.docIconWrap}><Ionicons name="card-outline" size={36} color={colors.onSurfaceVariant} /></View>
            }
          </TouchableOpacity>
          <Text style={styles.cardLabel}>DRIVER'S LICENSE</Text>
          <TouchableOpacity style={[styles.uploadButton, licenseUri ? styles.uploadButtonDone : undefined]} onPress={() => handleUpload('license')}>
            <Ionicons name={licenseUri ? 'checkmark-circle-outline' : 'cloud-upload-outline'} size={16} color={licenseUri ? SUCCESS_COLOR : colors.primary} />
            <Text style={[styles.uploadButtonText, licenseUri ? styles.uploadButtonTextDone : undefined]}>{licenseUri ? 'CHANGE' : 'UPLOAD IMAGE'}</Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <TouchableOpacity style={styles.termsRow} onPress={() => setAcceptedTerms(!acceptedTerms)} activeOpacity={0.7}>
          <View style={styles.checkbox}>
            {acceptedTerms && <Ionicons name="checkmark" size={14} color={colors.white} />}
          </View>
          <Text style={styles.termsText}>
            I certify that all documents provided are valid and belong to me. I agree to the{' '}
            <Text style={styles.termsLink}>Courier Terms of Service</Text>
            {' '}and authorize background verification as per regional regulations.
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, !acceptedTerms ? styles.submitButtonDisabled : undefined]}
          onPress={handleSubmit}
          activeOpacity={0.85}
        >
          <Text style={styles.submitButtonText}>SUBMIT APPLICATION</Text>
          <Ionicons name="send" size={18} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.hintText}>IDENTITY VERIFICATION USUALLY TAKES 12-24 HOURS</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  cameraContainer: { flex: 1, backgroundColor: colors.black },
  camera: { flex: 1 },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 60 },
  faceGuide: { width: 220, height: 280, borderRadius: 110, borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)', borderStyle: 'dashed' },
  cameraControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '80%' },
  cancelCameraButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  captureButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  captureButtonInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.white },
  topNav: { height: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  headerSection: { gap: spacing.sm, marginBottom: spacing.xs },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  verificationTitle: { fontSize: 18, fontWeight: '800', color: colors.onSurface, letterSpacing: 0.5 },
  progressSegments: { flexDirection: 'row', gap: spacing.xs },
  progressSegment: { width: 28, height: 4, borderRadius: borderRadius.full },
  progressSegmentDone: { backgroundColor: colors.outlineVariant },
  progressSegmentActive: { backgroundColor: colors.primaryContainer },
  subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, lineHeight: 22 },
  card: { backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.xl, padding: spacing.lg, gap: spacing.sm, alignItems: 'center' },
  previewArea: { width: '100%', height: 160, backgroundColor: colors.surfaceContainerHigh, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: colors.outlineVariant, borderStyle: 'dashed' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  selfieIconWrap: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.outline, alignItems: 'center', justifyContent: 'center' },
  docIconWrap: { alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: 13, fontWeight: '700', color: colors.onSurface, letterSpacing: 1, textAlign: 'center' },
  cardHint: { ...typography.labelSm, color: colors.onSurfaceVariant, textAlign: 'center' },
  actionButton: { width: '100%', height: 48, backgroundColor: colors.primaryContainer, borderRadius: borderRadius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xs },
  actionButtonText: { fontSize: 14, fontWeight: '700', color: colors.white, letterSpacing: 0.5 },
  uploadButton: { width: '100%', height: 44, borderWidth: 1, borderColor: colors.primary, borderRadius: borderRadius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.xs },
  uploadButtonDone: { borderColor: SUCCESS_COLOR },
  uploadButtonText: { fontSize: 13, fontWeight: '700', color: colors.primary, letterSpacing: 0.5 },
  uploadButtonTextDone: { color: SUCCESS_COLOR },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, backgroundColor: colors.surfaceContainerLow, padding: spacing.md, borderRadius: borderRadius.lg, marginTop: spacing.xs },
  checkbox: { width: 20, height: 20, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceContainerHigh, marginTop: 2, flexShrink: 0 },
  termsText: { ...typography.labelSm, color: colors.onSurfaceVariant, flex: 1, lineHeight: 18 },
  termsLink: { color: colors.primary, textDecorationLine: 'underline' },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.outlineVariant + '30', backgroundColor: colors.background },
  submitButton: { height: 52, backgroundColor: colors.primaryContainer, borderRadius: borderRadius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontSize: 15, fontWeight: '800', color: colors.white, letterSpacing: 1 },
  hintText: { ...typography.labelSm, color: colors.onSurfaceVariant, opacity: 0.6, textAlign: 'center' },
})
