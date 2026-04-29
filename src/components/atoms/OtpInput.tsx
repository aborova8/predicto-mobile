import { useImperativeHandle, useRef, type Ref } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { withAlpha } from '@/lib/colors';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

export interface OtpInputHandle {
  focus: () => void;
}

interface OtpInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  length?: number;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
  ref?: Ref<OtpInputHandle>;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled,
  error,
  autoFocus,
  ref,
}: OtpInputProps) {
  const theme = useTheme();
  const inputs = useRef<(TextInput | null)[]>([]);

  useImperativeHandle(ref, () => ({
    focus: () => inputs.current[0]?.focus(),
  }));

  const onCellChange = (i: number, raw: string) => {
    const v = raw.replace(/[^0-9]/g, '').slice(0, 1);
    const next = [...value];
    next[i] = v;
    onChange(next);
    if (v && i < length - 1) inputs.current[i + 1]?.focus();
  };

  const onKey = (i: number, key: string) => {
    if (key === 'Backspace' && !value[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  return (
    <View style={styles.row}>
      {Array.from({ length }, (_, i) => {
        const d = value[i] ?? '';
        const borderColor = error
          ? theme.loss
          : d
            ? withAlpha(theme.neon, 0.53)
            : theme.line;
        return (
          <TextInput
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={d}
            onChangeText={(v) => onCellChange(i, v)}
            onKeyPress={({ nativeEvent }) => onKey(i, nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={1}
            autoFocus={autoFocus && i === 0}
            editable={!disabled}
            style={[
              styles.cell,
              { backgroundColor: theme.surface, borderColor, color: theme.text },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  cell: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    fontFamily: Fonts.dispBlack,
    fontSize: 24,
    textAlign: 'center',
  },
});
