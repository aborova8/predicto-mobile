export const Fonts = {
  uiRegular: 'Inter_400Regular',
  uiMedium: 'Inter_500Medium',
  uiSemi: 'Inter_600SemiBold',
  uiBold: 'Inter_700Bold',
  uiBlack: 'Inter_800ExtraBold',
  dispMedium: 'SpaceGrotesk_500Medium',
  dispSemi: 'SpaceGrotesk_600SemiBold',
  dispBold: 'SpaceGrotesk_700Bold',
  dispBlack: 'SpaceGrotesk_700Bold',
  monoRegular: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
  monoSemi: 'JetBrainsMono_600SemiBold',
  monoBold: 'JetBrainsMono_700Bold',
  monoBlack: 'JetBrainsMono_800ExtraBold',
} as const;

export type FontName = (typeof Fonts)[keyof typeof Fonts];
