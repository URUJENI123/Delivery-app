import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, Modal,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { colors, spacing, borderRadius, typography } from '../../theme'
import type { RootStackParamList } from '../../types'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { RootTabParamList } from '../../types'

type Props = BottomTabScreenProps<RootTabParamList, 'Messages'>
type NavProp = NativeStackNavigationProp<RootStackParamList>

const activeDeliveries = [
  { id: 'jean-paul', name: 'Jean-Paul', avatar: 'https://i.pravatar.cc/96?img=12', live: true },
  { id: 'amina',     name: 'Amina',     avatar: 'https://i.pravatar.cc/96?img=20', live: false },
]

const chats = [
  {
    id: 'support', name: 'Support', avatar: null,
    lastMessage: 'Your refund for order #KE-892 has been processed.',
    time: 'Now', unread: true, unreadCount: 0,
    orderTag: null, bold: true,
  },
  {
    id: 'jean-paul', name: 'Jean-Paul', avatar: 'https://i.pravatar.cc/96?img=12',
    lastMessage: 'I am near Gishushu, will be there in 5 mins.',
    time: '12:45', unread: true, unreadCount: 2,
    orderTag: 'IN TRANSIT • Order #KE-442', bold: false,
  },
  {
    id: 'amina', name: 'Amina', avatar: 'https://i.pravatar.cc/96?img=20',
    lastMessage: 'Thank you for using KigaliExpress! Have a great day.',
    time: '10:20', unread: false, unreadCount: 0,
    orderTag: 'DELIVERED • Order #KE-410', bold: false,
  },
  {
    id: 'ganza', name: 'Ganza', avatar: 'https://i.pravatar.cc/96?img=33',
    lastMessage: 'Is the gate open or should I call when I arrive?',
    time: 'Yesterday', unread: false, unreadCount: 0,
    orderTag: null, bold: false,
  },
  {
    id: 'umutoni', name: 'Umutoni', avatar: 'https://i.pravatar.cc/96?img=47',
    lastMessage: 'Package picked up from Kimironko Market.',
    time: 'Mon', unread: false, unreadCount: 0,
    orderTag: null, bold: false,
  },
]

export function MessagesScreen({}: Props) {
  const navigation = useNavigation<NavProp>()
  const [search, setSearch] = useState('')
  const [composeVisible, setComposeVisible] = useState(false)
  const [newContact, setNewContact] = useState('')

  const filtered = chats.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(search.toLowerCase())
  )

  function openChat(chat: typeof chats[0]) {
    navigation.navigate('Chat', {
      id: chat.id,
      name: chat.name,
      avatar: chat.avatar ?? undefined,
      orderTag: chat.orderTag ?? undefined,
    })
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.topBar}>
        <View style={styles.profileThumb}>
          <Image source={{ uri: 'https://i.pravatar.cc/80?img=11' }} style={styles.profileImg} />
        </View>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={colors.onSurfaceVariant} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search chats or couriers..."
          placeholderTextColor={colors.outlineVariant}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Active Deliveries */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACTIVE DELIVERIES</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeRow}>
            {activeDeliveries.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={styles.activeItem}
                onPress={() => openChat({ ...chats.find(c => c.id === d.id)! })}
              >
                <View style={styles.activeAvatarWrap}>
                  <Image source={{ uri: d.avatar }} style={styles.activeAvatar} />
                  {d.live && (
                    <View style={styles.liveBadge}>
                      <Text style={styles.liveBadgeText}>LIVE</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.activeName}>{d.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recent Chats */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RECENT CHATS</Text>
          <View style={styles.chatList}>
            {filtered.map((chat, i) => (
              <TouchableOpacity
                key={chat.id}
                style={[styles.chatRow, i === 0 ? styles.chatRowHighlight : undefined]}
                onPress={() => openChat(chat)}
                activeOpacity={0.7}
              >
                {/* Avatar */}
                {chat.avatar ? (
                  <Image source={{ uri: chat.avatar }} style={styles.chatAvatar} />
                ) : (
                  <View style={styles.supportAvatar}>
                    <Ionicons name="headset" size={22} color={colors.white} />
                  </View>
                )}

                {/* Content */}
                <View style={styles.chatContent}>
                  <View style={styles.chatTopRow}>
                    <Text style={[styles.chatName, chat.unread ? styles.chatNameBold : undefined]}>
                      {chat.name}
                    </Text>
                    <Text style={styles.chatTime}>{chat.time}</Text>
                  </View>

                  {chat.orderTag && (
                    <View style={styles.orderTagRow}>
                      <View style={[
                        styles.orderTagBadge,
                        chat.orderTag.startsWith('IN TRANSIT') ? styles.orderTagActive : styles.orderTagDelivered,
                      ]}>
                        <Text style={styles.orderTagText}>
                          {chat.orderTag.split(' • ')[0]}
                        </Text>
                      </View>
                      <Text style={styles.orderTagId}>{chat.orderTag.split(' • ')[1]}</Text>
                    </View>
                  )}

                  <Text
                    style={[styles.chatLastMsg, chat.bold ? styles.chatLastMsgBold : undefined]}
                    numberOfLines={2}
                  >
                    {chat.lastMessage}
                  </Text>
                </View>

                {/* Unread badge */}
                {chat.unreadCount > 0 ? (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{chat.unreadCount}</Text>
                  </View>
                ) : chat.unread ? (
                  <View style={styles.unreadDot} />
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Compose FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setComposeVisible(true)}>
        <Ionicons name="create-outline" size={22} color={colors.white} />
      </TouchableOpacity>

      {/* New Message Modal */}
      <Modal
        visible={composeVisible}
        transparent
        animationType="slide"
        onRequestClose={() => { setComposeVisible(false); setNewContact(''); }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Message</Text>
              <TouchableOpacity onPress={() => { setComposeVisible(false); setNewContact(''); }}>
                <Ionicons name="close" size={24} color={colors.onSurface} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchRow}>
              <Ionicons name="person-add-outline" size={18} color={colors.primary} style={styles.modalSearchIcon} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Enter name or phone..."
                placeholderTextColor={colors.outlineVariant}
                value={newContact}
                onChangeText={setNewContact}
              />
            </View>

            <ScrollView contentContainerStyle={styles.modalList}>
              {newContact.trim().length > 0 && (
                <TouchableOpacity
                  style={[styles.modalItem, styles.modalItemNew]}
                  onPress={() => {
                    const name = newContact.trim()
                    openChat({
                      id: name.toLowerCase().replace(/\s+/g, '-'),
                      name: name,
                      avatar: null,
                      lastMessage: '',
                      time: '',
                      unread: false,
                      unreadCount: 0,
                      orderTag: 'Direct Message',
                      bold: false,
                    })
                    setComposeVisible(false)
                    setNewContact('')
                  }}
                >
                  <View style={styles.modalNewAvatar}>
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.white} />
                  </View>
                  <View>
                    <Text style={styles.modalNewText}>Start Chat with</Text>
                    <Text style={styles.modalName}>{newContact.trim()}</Text>
                  </View>
                </TouchableOpacity>
              )}

              <Text style={styles.modalSectionLabel}>SUGGESTED CONTACTS</Text>
              {chats.map((chat) => (
                <TouchableOpacity
                  key={chat.id}
                  style={styles.modalItem}
                  onPress={() => {
                    openChat(chat)
                    setComposeVisible(false)
                    setNewContact('')
                  }}
                >
                  {chat.avatar ? (
                    <Image source={{ uri: chat.avatar }} style={styles.modalAvatar} />
                  ) : (
                    <View style={styles.modalSupportAvatar}>
                      <Ionicons name="headset" size={18} color={colors.white} />
                    </View>
                  )}
                  <View>
                    <Text style={styles.modalName}>{chat.name}</Text>
                    {chat.orderTag && <Text style={styles.modalSub}>{chat.orderTag}</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  topBar: {
    height: 56, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: spacing.lg,
  },
  profileThumb: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
  profileImg: { width: 40, height: 40 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.primary },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.md, height: 44,
  },
  searchIcon: { flexShrink: 0 },
  searchInput: { flex: 1, color: colors.onSurface, fontSize: 14 },

  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.onSurfaceVariant,
    letterSpacing: 1, marginBottom: spacing.sm,
  },

  // Active deliveries
  activeRow: { marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg },
  activeItem: { alignItems: 'center', marginRight: spacing.md, gap: 6 },
  activeAvatarWrap: { position: 'relative' },
  activeAvatar: {
    width: 64, height: 64, borderRadius: 12,
    borderWidth: 2, borderColor: colors.outlineVariant,
  },
  liveBadge: {
    position: 'absolute', bottom: -6, left: '50%',
    transform: [{ translateX: -16 }],
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  liveBadgeText: { fontSize: 9, fontWeight: '800', color: colors.white, letterSpacing: 0.5 },
  activeName: { fontSize: 12, color: colors.onSurfaceVariant, fontWeight: '500' },

  // Chat list
  chatList: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: colors.outlineVariant,
    overflow: 'hidden',
  },
  chatRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.outlineVariant + '40',
  },
  chatRowHighlight: { backgroundColor: colors.surfaceContainerHigh },
  chatAvatar: { width: 52, height: 52, borderRadius: 26, flexShrink: 0 },
  supportAvatar: {
    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  chatContent: { flex: 1, gap: 4 },
  chatTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName: { fontSize: 15, fontWeight: '600', color: colors.onSurface },
  chatNameBold: { fontWeight: '800' },
  chatTime: { fontSize: 11, color: colors.onSurfaceVariant },
  orderTagRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderTagBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  orderTagActive: { backgroundColor: colors.primaryContainer },
  orderTagDelivered: { backgroundColor: colors.surfaceContainerHighest },
  orderTagText: { fontSize: 9, fontWeight: '700', color: colors.white, textTransform: 'uppercase' },
  orderTagId: { fontSize: 11, color: colors.onSurfaceVariant },
  chatLastMsg: { fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 18 },
  chatLastMsgBold: { color: colors.onSurface, fontWeight: '600' },
  unreadBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
  },
  unreadBadgeText: { fontSize: 11, fontWeight: '700', color: colors.white },
  unreadDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.primaryContainer, flexShrink: 0, marginTop: 6,
  },

  fab: {
    position: 'absolute', bottom: spacing.xl, right: spacing.lg,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.black, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surfaceContainer,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant + '40',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.onSurface,
  },
  modalList: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant + '40',
  },
  modalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  modalSupportAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
  },
  modalSub: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  modalSearchRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.md, height: 44,
  },
  modalSearchIcon: { flexShrink: 0 },
  modalSearchInput: { flex: 1, color: colors.onSurface, fontSize: 14 },
  modalSectionLabel: {
    fontSize: 10, fontWeight: '700', color: colors.onSurfaceVariant,
    letterSpacing: 1, marginVertical: spacing.xs, paddingLeft: spacing.xs,
  },
  modalItemNew: {
    backgroundColor: colors.primaryContainer + '20',
    borderColor: colors.primary,
  },
  modalNewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalNewText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
})
