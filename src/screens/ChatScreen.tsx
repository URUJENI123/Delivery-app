import { useState, useRef } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Image, Linking,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'
import { colors, spacing, borderRadius, typography } from '../theme'

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>

interface Message {
  id: string
  text: string
  mine: boolean
  time: string
}

const phoneNumbers: Record<string, string> = {
  support:    '+250788000000',
  'jean-paul':'+250788000123',
  amina:      '+250788000456',
  ganza:      '+250788000789',
  umutoni:    '+250788000321',
}

const initialMessages: Record<string, Message[]> = {
  support: [
    { id: '1', text: 'Hello! How can we help you today?', mine: false, time: '09:00' },
    { id: '2', text: 'Your refund for order #KE-892 has been processed.', mine: false, time: 'Now' },
  ],
  'jean-paul': [
    { id: '1', text: 'Hi, I picked up your package.', mine: false, time: '12:30' },
    { id: '2', text: 'Great! How long will it take?', mine: true, time: '12:32' },
    { id: '3', text: 'I am near Gishushu, will be there in 5 mins.', mine: false, time: '12:45' },
  ],
  amina: [
    { id: '1', text: 'Package delivered successfully!', mine: false, time: '10:15' },
    { id: '2', text: 'Thank you!', mine: true, time: '10:18' },
    { id: '3', text: 'Thank you for using KigaliExpress! Have a great day.', mine: false, time: '10:20' },
  ],
  ganza: [
    { id: '1', text: 'I will arrive in about 10 minutes.', mine: false, time: 'Yesterday' },
    { id: '2', text: 'Is the gate open or should I call when I arrive?', mine: false, time: 'Yesterday' },
    { id: '3', text: 'Please call when you arrive.', mine: true, time: 'Yesterday' },
  ],
  umutoni: [
    { id: '1', text: 'Package picked up from Kimironko Market.', mine: false, time: 'Mon' },
    { id: '2', text: 'Thanks for the update!', mine: true, time: 'Mon' },
  ],
}

export function ChatScreen({ route, navigation }: Props) {
  const { id, name, avatar, orderTag } = route.params
  const key = id.toLowerCase()
  const [messages, setMessages] = useState<Message[]>(initialMessages[key] ?? [])
  const [input, setInput] = useState('')
  const listRef = useRef<FlatList>(null)

  function sendMessage() {
    const text = input.trim()
    if (!text) return
    const now = new Date()
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
    setMessages(prev => [...prev, { id: String(Date.now()), text, mine: true, time }])
    setInput('')
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Ionicons name="headset" size={18} color={colors.white} />
            </View>
          )}
          <View>
            <Text style={styles.headerName}>{name}</Text>
            {orderTag && <Text style={styles.headerOrder}>{orderTag}</Text>}
          </View>
        </View>
        <TouchableOpacity style={styles.callBtn} onPress={() => {
          const phone = phoneNumbers[key]
          if (phone) Linking.openURL(`tel:${phone}`)
        }}>
          <Ionicons name="call-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.mine ? styles.bubbleMine : styles.bubbleTheirs]}>
            <Text style={[styles.bubbleText, item.mine ? styles.bubbleTextMine : undefined]}>
              {item.text}
            </Text>
            <Text style={[styles.bubbleTime, item.mine ? styles.bubbleTimeMine : undefined]}>
              {item.time}
            </Text>
          </View>
        )}
      />

      {/* Input bar */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.outlineVariant}
            multiline
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() ? styles.sendBtnDisabled : undefined]}
            onPress={sendMessage}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  topBar: {
    height: 56, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.outlineVariant + '60',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm },
  headerAvatar: { width: 36, height: 36, borderRadius: 18 },
  headerAvatarPlaceholder: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center',
  },
  headerName: { fontSize: 15, fontWeight: '700', color: colors.onSurface },
  headerOrder: { fontSize: 11, color: colors.onSurfaceVariant },
  callBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  messageList: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.lg },

  bubble: {
    maxWidth: '78%', borderRadius: borderRadius.xl, padding: spacing.sm,
    paddingHorizontal: spacing.md, gap: 4,
  },
  bubbleMine: {
    alignSelf: 'flex-end', backgroundColor: colors.primaryContainer,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    alignSelf: 'flex-start', backgroundColor: colors.surfaceContainerHigh,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 14, color: colors.onSurface, lineHeight: 20 },
  bubbleTextMine: { color: colors.white },
  bubbleTime: { fontSize: 10, color: colors.onSurfaceVariant, alignSelf: 'flex-end' },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.6)' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.outlineVariant + '60',
    backgroundColor: colors.background,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    color: colors.onSurface, fontSize: 14,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
})
