import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Avatar } from '@/components/atoms/Avatar';
import { BottomSheet } from '@/components/sheets/BottomSheet';
import { COMMENTS } from '@/data/comments';
import { POSTS } from '@/data/posts';
import { USERS } from '@/data/users';
import { useAppState } from '@/state/AppStateContext';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

export default function CommentsScreen() {
  const theme = useTheme();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { posts } = useAppState();
  const post = posts.find((p) => p.id === postId) ?? POSTS.find((p) => p.id === postId);
  const comments = postId ? COMMENTS[postId] ?? [] : [];
  const [text, setText] = useState('');

  if (!post) return null;

  const title = (
    <Text style={{ color: theme.text, fontFamily: Fonts.dispBold, fontSize: 16 }}>
      Comments{' '}
      <Text style={{ color: theme.text3, fontFamily: Fonts.monoRegular, fontSize: 12 }}>
        {comments.length}
      </Text>
    </Text>
  );

  return (
    <BottomSheet height="78%" title={title}>
      <ScrollView contentContainerStyle={{ paddingVertical: 8 }}>
        {comments.length === 0 ? (
          <Text style={[styles.empty, { color: theme.text3 }]}>
            No comments yet. Start the conversation.
          </Text>
        ) : (
          comments.map((c) => {
            const u = USERS[c.userId];
            return (
              <View key={c.id} style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {u ? <Avatar user={u} size={32} /> : null}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
                      <Text style={{ color: theme.text, fontFamily: Fonts.dispBold, fontSize: 13 }}>
                        {u?.name}
                      </Text>
                      <Text style={{ color: theme.text3, fontFamily: Fonts.monoRegular, fontSize: 10 }}>
                        {c.time}
                      </Text>
                    </View>
                    <Text style={{ color: theme.text, fontFamily: Fonts.uiRegular, fontSize: 13, marginTop: 2, lineHeight: 18 }}>
                      {c.text}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 14, marginTop: 5 }}>
                      <Text style={{ color: theme.text3, fontFamily: Fonts.monoRegular, fontSize: 11 }}>
                        ♥ {c.likes}
                      </Text>
                      <Text style={{ color: theme.text3, fontFamily: Fonts.monoRegular, fontSize: 11 }}>
                        Reply
                      </Text>
                    </View>
                  </View>
                </View>
                {c.replies && c.replies.length > 0 ? (
                  <View
                    style={{
                      marginLeft: 42,
                      marginTop: 8,
                      borderLeftWidth: 1,
                      borderLeftColor: theme.line,
                      paddingLeft: 10,
                    }}
                  >
                    {c.replies.map((r) => {
                      const ru = USERS[r.userId];
                      return (
                        <View key={r.id} style={{ flexDirection: 'row', gap: 8, paddingTop: 8 }}>
                          {ru ? <Avatar user={ru} size={26} /> : null}
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
                              <Text style={{ color: theme.text, fontFamily: Fonts.dispBold, fontSize: 12 }}>
                                {ru?.name}
                              </Text>
                              <Text style={{ color: theme.text3, fontFamily: Fonts.monoRegular, fontSize: 10 }}>
                                {r.time}
                              </Text>
                            </View>
                            <Text style={{ color: theme.text, fontFamily: Fonts.uiRegular, fontSize: 12.5, marginTop: 1 }}>
                              {r.text}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.composer, { borderTopColor: theme.lineSoft }]}>
          <Avatar user={USERS.u1} size={32} />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Add a comment…"
            placeholderTextColor={theme.text3}
            style={[
              styles.input,
              { backgroundColor: theme.surface, borderColor: theme.line, color: theme.text },
            ]}
          />
          <Pressable
            style={[
              styles.postBtn,
              { backgroundColor: text ? theme.neon : theme.surface2 },
            ]}
          >
            <Text style={{ fontFamily: Fonts.dispBold, fontSize: 13, color: text ? '#06091A' : theme.text3 }}>
              Post
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  empty: {
    paddingVertical: 32,
    textAlign: 'center',
    fontFamily: Fonts.uiRegular,
    fontSize: 13,
  },
  composer: {
    paddingTop: 10,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontFamily: Fonts.uiRegular,
    fontSize: 13,
  },
  postBtn: {
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
});
