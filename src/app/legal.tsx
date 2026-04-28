import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/nav/ScreenHeader';
import { LEGAL_DOCS } from '@/data/legal';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

export default function LegalScreen() {
  const theme = useTheme();
  const { doc } = useLocalSearchParams<{ doc?: 'terms' | 'privacy' }>();
  const d = LEGAL_DOCS[doc === 'privacy' ? 'privacy' : 'terms'];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScreenHeader title={d.title} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.updated, { color: theme.text3 }]}>{d.updated.toUpperCase()}</Text>
        <Text style={[styles.intro, { color: theme.text2 }]}>{d.intro}</Text>
        {d.sections.map((s, i) => (
          <View key={i} style={{ marginBottom: 22 }}>
            <Text style={[styles.h2, { color: theme.text }]}>{s.h}</Text>
            {s.body.map((p, j) => (
              <Text key={j} style={[styles.p, { color: theme.text2 }]}>{p}</Text>
            ))}
          </View>
        ))}
        <View
          style={[
            styles.footnote,
            { backgroundColor: theme.surface, borderColor: theme.line },
          ]}
        >
          <Text style={[styles.footnoteTxt, { color: theme.text3 }]}>
            THIS IS A SUMMARY DOCUMENT FOR DEMO PURPOSES.
          </Text>
          <Text style={[styles.footnoteTxt, { color: theme.text3 }]}>
            PRODUCTION COPY SHOULD BE REVIEWED BY LEGAL COUNSEL.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 100,
  },
  updated: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.4,
    marginBottom: 14,
  },
  intro: {
    fontFamily: Fonts.uiRegular,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 22,
  },
  h2: {
    fontFamily: Fonts.dispBold,
    fontSize: 15,
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  p: {
    fontFamily: Fonts.uiRegular,
    fontSize: 13.5,
    lineHeight: 21,
    marginBottom: 8,
  },
  footnote: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  footnoteTxt: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 0.4,
    lineHeight: 18,
  },
});
