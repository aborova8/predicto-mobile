import Svg, { Circle, Path, Rect, type SvgProps } from 'react-native-svg';

export type IconName =
  | 'home'
  | 'plus'
  | 'trophy'
  | 'people'
  | 'profile'
  | 'heart'
  | 'comment'
  | 'share'
  | 'bell'
  | 'search'
  | 'filter'
  | 'chevron'
  | 'chevronL'
  | 'check'
  | 'x'
  | 'lock'
  | 'flame'
  | 'star'
  | 'logout'
  | 'settings'
  | 'apple'
  | 'google'
  | 'eye'
  | 'add-friend'
  | 'check-friend';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  stroke?: number;
}

export function Icon({ name, size = 22, color = '#ffffff', stroke = 1.7 }: IconProps) {
  const props: SvgProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  switch (name) {
    case 'home':
      return (
        <Svg {...props}>
          <Path d="M3 11l9-8 9 8M5 10v10h4v-6h6v6h4V10" />
        </Svg>
      );
    case 'plus':
      return (
        <Svg {...props}>
          <Path d="M12 5v14M5 12h14" />
        </Svg>
      );
    case 'trophy':
      return (
        <Svg {...props}>
          <Path d="M6 4h12v4a6 6 0 11-12 0V4zM6 6H3a3 3 0 003 3M18 6h3a3 3 0 01-3 3M9 18h6M12 14v4" />
        </Svg>
      );
    case 'people':
      return (
        <Svg {...props}>
          <Circle cx="9" cy="8" r="3.5" />
          <Path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6" />
          <Circle cx="17" cy="7" r="2.5" />
          <Path d="M22 18c0-2.5-2-4-4.5-4" />
        </Svg>
      );
    case 'profile':
      return (
        <Svg {...props}>
          <Circle cx="12" cy="9" r="4" />
          <Path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
        </Svg>
      );
    case 'heart':
      return (
        <Svg {...props}>
          <Path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z" />
        </Svg>
      );
    case 'comment':
      return (
        <Svg {...props}>
          <Path d="M21 12a8 8 0 01-8 8 8 8 0 01-3.5-.8L4 21l1.2-4.5A8 8 0 1121 12z" />
        </Svg>
      );
    case 'share':
      return (
        <Svg {...props}>
          <Path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7M16 6l-4-4-4 4M12 2v14" />
        </Svg>
      );
    case 'bell':
      return (
        <Svg {...props}>
          <Path d="M6 8a6 6 0 0112 0c0 7 3 7 3 9H3c0-2 3-2 3-9zM10 21a2 2 0 004 0" />
        </Svg>
      );
    case 'search':
      return (
        <Svg {...props}>
          <Circle cx="11" cy="11" r="7" />
          <Path d="M21 21l-4.5-4.5" />
        </Svg>
      );
    case 'filter':
      return (
        <Svg {...props}>
          <Path d="M3 5h18M6 12h12M10 19h4" />
        </Svg>
      );
    case 'chevron':
      return (
        <Svg {...props}>
          <Path d="M9 6l6 6-6 6" />
        </Svg>
      );
    case 'chevronL':
      return (
        <Svg {...props}>
          <Path d="M15 6l-6 6 6 6" />
        </Svg>
      );
    case 'check':
      return (
        <Svg {...props}>
          <Path d="M5 12l5 5 9-11" />
        </Svg>
      );
    case 'x':
      return (
        <Svg {...props}>
          <Path d="M6 6l12 12M18 6l-12 12" />
        </Svg>
      );
    case 'lock':
      return (
        <Svg {...props}>
          <Rect x="5" y="11" width="14" height="10" rx="2" />
          <Path d="M8 11V8a4 4 0 018 0v3" />
        </Svg>
      );
    case 'flame':
      return (
        <Svg {...props}>
          <Path d="M12 3c1 4 5 5 5 10a5 5 0 11-10 0c0-2 1-3 2-4-1-3 1-5 3-6z" />
        </Svg>
      );
    case 'star':
      return (
        <Svg {...props}>
          <Path d="M12 3l2.6 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.4-.5L12 3z" />
        </Svg>
      );
    case 'logout':
      return (
        <Svg {...props}>
          <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H10" />
        </Svg>
      );
    case 'settings':
      return (
        <Svg {...props}>
          <Circle cx="12" cy="12" r="3" />
          <Path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
        </Svg>
      );
    case 'apple':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            fill={color}
            d="M17.05 12.04c0-2.81 2.3-4.15 2.4-4.22-1.31-1.92-3.35-2.18-4.07-2.21-1.73-.18-3.38 1.02-4.26 1.02-.88 0-2.24-1-3.69-.97-1.9.03-3.65 1.1-4.62 2.8-1.97 3.42-.5 8.49 1.42 11.27.94 1.36 2.06 2.89 3.51 2.84 1.41-.06 1.95-.91 3.66-.91 1.7 0 2.19.91 3.69.88 1.52-.03 2.49-1.39 3.42-2.76 1.08-1.59 1.52-3.13 1.55-3.21-.03-.01-2.97-1.14-3-4.53zM14.34 4.04c.78-.94 1.3-2.25 1.16-3.55-1.12.05-2.47.74-3.27 1.69-.72.83-1.35 2.16-1.18 3.43 1.24.1 2.52-.63 3.29-1.57z"
          />
        </Svg>
      );
    case 'google':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h5.92a5.06 5.06 0 01-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.32z" fill="#4285F4" />
          <Path d="M12 23c2.97 0 5.46-.98 7.29-2.66l-3.57-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.85A11 11 0 0012 23z" fill="#34A853" />
          <Path d="M5.84 14.11A6.6 6.6 0 015.5 12c0-.73.13-1.44.34-2.11V7.04H2.16a11 11 0 000 9.92l3.68-2.85z" fill="#FBBC05" />
          <Path d="M12 5.36c1.62 0 3.06.56 4.21 1.65l3.15-3.15A11 11 0 0012 1a11 11 0 00-9.84 6.04l3.68 2.85C6.71 7.29 9.14 5.36 12 5.36z" fill="#EA4335" />
        </Svg>
      );
    case 'eye':
      return (
        <Svg {...props}>
          <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
          <Circle cx="12" cy="12" r="3" />
        </Svg>
      );
    case 'add-friend':
      return (
        <Svg {...props}>
          <Circle cx="9" cy="9" r="3.5" />
          <Path d="M2 20c0-3.5 3-6 7-6 1.5 0 2.9.4 4 1" />
          <Path d="M19 14v6M16 17h6" />
        </Svg>
      );
    case 'check-friend':
      return (
        <Svg {...props}>
          <Circle cx="9" cy="9" r="3.5" />
          <Path d="M2 20c0-3.5 3-6 7-6 1.5 0 2.9.4 4 1" />
          <Path d="M16 18l2 2 4-4" />
        </Svg>
      );
    default:
      return null;
  }
}
