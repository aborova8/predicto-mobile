import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Avatar } from '@/components/atoms/Avatar';
import { Icon } from '@/components/atoms/Icon';
import { BottomSheet } from '@/components/sheets/BottomSheet';
import { errorMessage } from '@/lib/api';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type { Group, GroupJoinRequest, GroupMember } from '@/types/domain';

type Panel = 'home' | 'edit' | 'requests' | 'members' | 'transfer';

const PANEL_TITLES: Record<Panel, string> = {
  home: 'Manage group',
  edit: 'Edit details',
  requests: 'Join requests',
  members: 'Members',
  transfer: 'Transfer ownership',
};

interface ManageSheetProps {
  open: boolean;
  onClose: () => void;
  group: Group;
  members: GroupMember[];
  joinRequests: GroupJoinRequest[];
  onUpdate: (patch: { name?: string; description?: string }) => Promise<void>;
  onChangeRole: (userId: string, role: 'ADMIN' | 'MEMBER') => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onRespond: (requestId: string, action: 'approve' | 'reject') => Promise<void>;
  onTransfer: (newOwnerId: string) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function ManageSheet(props: ManageSheetProps) {
  const { open, onClose, group } = props;
  const [panel, setPanel] = useState<Panel>('home');

  useEffect(() => {
    if (open) setPanel('home');
  }, [open]);

  const isOwner = group.viewerRole === 'OWNER';
  const titleText = PANEL_TITLES[panel];

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <BottomSheet
        title={<TitleBar text={titleText} canBack={panel !== 'home'} onBack={() => setPanel('home')} />}
        onClose={onClose}
        height="85%"
      >
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
          {panel === 'home' ? (
            <HomePanel
              joinRequests={props.joinRequests}
              isOwner={isOwner}
              onSelect={setPanel}
              onDelete={props.onDelete}
              onClose={onClose}
            />
          ) : null}
          {panel === 'edit' ? (
            <EditPanel
              group={group}
              onSave={props.onUpdate}
              onBack={() => setPanel('home')}
            />
          ) : null}
          {panel === 'requests' ? (
            <RequestsPanel
              requests={props.joinRequests}
              onRespond={props.onRespond}
              onBack={() => setPanel('home')}
            />
          ) : null}
          {panel === 'members' ? (
            <MembersPanel
              members={props.members}
              ownerId={group.ownerId}
              isOwner={isOwner}
              onChangeRole={props.onChangeRole}
              onRemove={props.onRemoveMember}
            />
          ) : null}
          {panel === 'transfer' ? (
            <TransferPanel
              members={props.members}
              ownerId={group.ownerId}
              onTransfer={props.onTransfer}
              onBack={() => setPanel('home')}
              onDone={onClose}
            />
          ) : null}
        </ScrollView>
      </BottomSheet>
    </Modal>
  );
}

function TitleBar({ text, canBack, onBack }: { text: string; canBack: boolean; onBack: () => void }) {
  const theme = useTheme();
  if (!canBack) {
    return <Text style={[styles.titleText, { color: theme.text }]}>{text}</Text>;
  }
  return (
    <Pressable onPress={onBack} hitSlop={8} style={styles.titleBack}>
      <Icon name="chevronL" size={18} color={theme.text2} />
      <Text style={[styles.titleText, { color: theme.text }]}>{text}</Text>
    </Pressable>
  );
}

interface HomePanelProps {
  joinRequests: GroupJoinRequest[];
  isOwner: boolean;
  onSelect: (p: Panel) => void;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

function HomePanel({ joinRequests, isOwner, onSelect, onDelete, onClose }: HomePanelProps) {
  const theme = useTheme();
  const confirmDelete = () => {
    Alert.alert(
      'Delete group?',
      'This permanently removes the group, its members, and all join requests. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete();
              onClose();
            } catch (err) {
              Alert.alert('Could not delete group', errorMessage(err, 'Try again.'));
            }
          },
        },
      ],
    );
  };

  return (
    <View style={{ gap: 8 }}>
      <RowButton
        icon="settings"
        label="Edit name & description"
        onPress={() => onSelect('edit')}
      />
      <RowButton
        icon="bell"
        label="Join requests"
        badge={joinRequests.length || undefined}
        onPress={() => onSelect('requests')}
      />
      <RowButton
        icon="people"
        label="Members"
        onPress={() => onSelect('members')}
      />
      {isOwner ? (
        <>
          <RowButton
            icon="star"
            label="Transfer ownership"
            onPress={() => onSelect('transfer')}
          />
          <Pressable
            onPress={confirmDelete}
            style={[styles.dangerRow, { borderColor: theme.line }]}
          >
            <Text style={[styles.dangerLabel, { color: theme.loss }]}>Delete group</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

interface RowButtonProps {
  icon: 'settings' | 'bell' | 'people' | 'star';
  label: string;
  badge?: number;
  onPress: () => void;
}
function RowButton({ icon, label, badge, onPress }: RowButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.line }]}
    >
      <Icon name={icon} size={20} color={theme.text} />
      <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: theme.neon }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <Icon name="chevron" size={18} color={theme.text3} />
    </Pressable>
  );
}

interface EditPanelProps {
  group: Group;
  onSave: (patch: { name?: string; description?: string }) => Promise<void>;
  onBack: () => void;
}
function EditPanel({ group, onSave, onBack }: EditPanelProps) {
  const theme = useTheme();
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? '');
  const [saving, setSaving] = useState(false);

  const dirty = name.trim() !== group.name || description.trim() !== (group.description ?? '');
  const valid = name.trim().length >= 2 && name.trim().length <= 60;

  const submit = async () => {
    if (!dirty || !valid || saving) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim() !== group.name ? name.trim() : undefined,
        description: description.trim() !== (group.description ?? '') ? description.trim() : undefined,
      });
      onBack();
    } catch (err) {
      Alert.alert('Could not save', errorMessage(err, 'Try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <View>
        <Text style={[styles.label, { color: theme.text3 }]}>NAME</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          maxLength={60}
          style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.text }]}
        />
      </View>
      <View>
        <Text style={[styles.label, { color: theme.text3 }]}>DESCRIPTION</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          maxLength={500}
          multiline
          style={[
            styles.input,
            styles.multi,
            { backgroundColor: theme.surface, borderColor: theme.line, color: theme.text },
          ]}
        />
      </View>
      <View style={styles.formActions}>
        <Pressable onPress={onBack} style={[styles.cancel, { borderColor: theme.line }]}>
          <Text style={[styles.cancelText, { color: theme.text2 }]}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={submit}
          disabled={!dirty || !valid || saving}
          style={[
            styles.save,
            {
              backgroundColor: dirty && valid && !saving ? theme.neon : theme.surface2,
            },
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#06091A" />
          ) : (
            <Text style={[styles.saveText, { color: dirty && valid ? '#06091A' : theme.text3 }]}>Save</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

interface RequestsPanelProps {
  requests: GroupJoinRequest[];
  onRespond: (requestId: string, action: 'approve' | 'reject') => Promise<void>;
  onBack: () => void;
}
function RequestsPanel({ requests, onRespond, onBack }: RequestsPanelProps) {
  const theme = useTheme();
  const [pending, setPending] = useState<string | null>(null);

  const respond = async (requestId: string, action: 'approve' | 'reject') => {
    setPending(requestId);
    try {
      await onRespond(requestId, action);
    } catch (err) {
      Alert.alert('Could not respond', errorMessage(err, 'Try again.'));
    } finally {
      setPending(null);
    }
  };

  if (requests.length === 0) {
    return (
      <View style={{ gap: 12 }}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Icon name="chevronL" size={18} color={theme.text2} />
          <Text style={[styles.backText, { color: theme.text2 }]}>Back</Text>
        </Pressable>
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No pending requests</Text>
          <Text style={[styles.emptyBody, { color: theme.text2 }]}>
            New private-group requests will appear here.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      {requests.map((req) => (
        <View
          key={req.id}
          style={[styles.memberRow, { backgroundColor: theme.surface, borderColor: theme.line }]}
        >
          <Avatar author={req.user} size={36} />
          <Text style={[styles.memberName, { color: theme.text }]} numberOfLines={1}>
            @{req.user.username}
          </Text>
          {pending === req.id ? (
            <ActivityIndicator color={theme.text2} />
          ) : (
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pressable
                onPress={() => respond(req.id, 'reject')}
                style={[styles.smallBtn, { borderColor: theme.line }]}
              >
                <Text style={[styles.smallBtnText, { color: theme.text2 }]}>Reject</Text>
              </Pressable>
              <Pressable
                onPress={() => respond(req.id, 'approve')}
                style={[styles.smallBtn, { backgroundColor: theme.neon, borderColor: theme.neon }]}
              >
                <Text style={[styles.smallBtnText, { color: '#06091A' }]}>Approve</Text>
              </Pressable>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

interface MembersPanelProps {
  members: GroupMember[];
  ownerId: string;
  isOwner: boolean;
  onChangeRole: (userId: string, role: 'ADMIN' | 'MEMBER') => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
}
function MembersPanel({ members, ownerId, isOwner, onChangeRole, onRemove }: MembersPanelProps) {
  const theme = useTheme();
  const [pending, setPending] = useState<string | null>(null);

  const promptForMember = (m: GroupMember) => {
    if (m.userId === ownerId) return;
    const isAdmin = m.role === 'ADMIN';
    const buttons: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[] = [];

    if (isOwner) {
      buttons.push({
        text: isAdmin ? 'Demote to member' : 'Promote to admin',
        onPress: async () => {
          setPending(m.userId);
          try {
            await onChangeRole(m.userId, isAdmin ? 'MEMBER' : 'ADMIN');
          } catch (err) {
            Alert.alert('Could not change role', errorMessage(err, 'Try again.'));
          } finally {
            setPending(null);
          }
        },
      });
    }

    buttons.push({
      text: 'Remove from group',
      style: 'destructive',
      onPress: async () => {
        setPending(m.userId);
        try {
          await onRemove(m.userId);
        } catch (err) {
          Alert.alert('Could not remove member', errorMessage(err, 'Try again.'));
        } finally {
          setPending(null);
        }
      },
    });

    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(`@${m.user.username}`, undefined, buttons);
  };

  return (
    <View style={{ gap: 8 }}>
      {members.map((m) => (
        <Pressable
          key={m.id}
          onPress={() => promptForMember(m)}
          disabled={m.userId === ownerId}
          style={[styles.memberRow, { backgroundColor: theme.surface, borderColor: theme.line }]}
        >
          <Avatar author={m.user} size={36} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.memberName, { color: theme.text }]} numberOfLines={1}>
              @{m.user.username}
            </Text>
            <Text style={[styles.roleTag, { color: theme.text3 }]}>{m.role}</Text>
          </View>
          {pending === m.userId ? <ActivityIndicator color={theme.text2} /> : null}
        </Pressable>
      ))}
    </View>
  );
}

interface TransferPanelProps {
  members: GroupMember[];
  ownerId: string;
  onTransfer: (newOwnerId: string) => Promise<void>;
  onBack: () => void;
  onDone: () => void;
}
function TransferPanel({ members, ownerId, onTransfer, onBack, onDone }: TransferPanelProps) {
  const theme = useTheme();
  const [pending, setPending] = useState<string | null>(null);
  const candidates = members.filter((m) => m.userId !== ownerId);

  const select = (m: GroupMember) => {
    Alert.alert(
      'Transfer ownership?',
      `@${m.user.username} will become the owner. You will become an admin and can no longer delete the group or transfer it back without their permission.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Transfer',
          style: 'destructive',
          onPress: async () => {
            setPending(m.userId);
            try {
              await onTransfer(m.userId);
              onDone();
            } catch (err) {
              Alert.alert('Could not transfer', errorMessage(err, 'Try again.'));
            } finally {
              setPending(null);
            }
          },
        },
      ],
    );
  };

  if (candidates.length === 0) {
    return (
      <View style={{ gap: 12 }}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Icon name="chevronL" size={18} color={theme.text2} />
          <Text style={[styles.backText, { color: theme.text2 }]}>Back</Text>
        </Pressable>
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No eligible members</Text>
          <Text style={[styles.emptyBody, { color: theme.text2 }]}>
            Add members to the group before transferring ownership.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      <Text style={[styles.hint, { color: theme.text2 }]}>
        Pick a member to receive ownership. They’ll become OWNER; you’ll be demoted to ADMIN.
      </Text>
      {candidates.map((m) => (
        <Pressable
          key={m.id}
          onPress={() => select(m)}
          style={[styles.memberRow, { backgroundColor: theme.surface, borderColor: theme.line }]}
        >
          <Avatar author={m.user} size={36} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.memberName, { color: theme.text }]} numberOfLines={1}>
              @{m.user.username}
            </Text>
            <Text style={[styles.roleTag, { color: theme.text3 }]}>{m.role}</Text>
          </View>
          {pending === m.userId ? <ActivityIndicator color={theme.text2} /> : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  rowLabel: {
    flex: 1,
    fontFamily: Fonts.uiMedium,
    fontSize: 14,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: Fonts.uiBold,
    fontSize: 11,
    color: '#06091A',
  },
  dangerRow: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 6,
  },
  dangerLabel: {
    fontFamily: Fonts.uiBold,
    fontSize: 14,
  },
  label: {
    fontFamily: Fonts.uiBold,
    fontSize: 11,
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: Fonts.uiRegular,
    fontSize: 15,
  },
  multi: {
    minHeight: 86,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancel: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelText: {
    fontFamily: Fonts.dispBold,
    fontSize: 14,
  },
  save: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontFamily: Fonts.dispBold,
    fontSize: 14,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  memberName: {
    fontFamily: Fonts.uiBold,
    fontSize: 14,
  },
  roleTag: {
    fontFamily: Fonts.uiMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    marginTop: 2,
  },
  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  smallBtnText: {
    fontFamily: Fonts.uiBold,
    fontSize: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  backText: {
    fontFamily: Fonts.uiMedium,
    fontSize: 14,
  },
  empty: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontFamily: Fonts.dispBold,
    fontSize: 16,
  },
  emptyBody: {
    fontFamily: Fonts.uiRegular,
    fontSize: 13,
    textAlign: 'center',
  },
  hint: {
    fontFamily: Fonts.uiRegular,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  titleText: {
    fontFamily: Fonts.dispBold,
    fontSize: 16,
  },
  titleBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
