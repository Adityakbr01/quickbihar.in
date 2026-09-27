import React from 'react';
import * as IoIcons from 'react-icons/io5';
import * as FiIcons from 'react-icons/fi';
import * as MdIcons from 'react-icons/md';
import * as FaIcons from 'react-icons/fa6';
import * as AiIcons from 'react-icons/ai';
import { processStyle } from './react-native.web';

function toPascalCase(str: string): string {
  if (!str) return '';
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function createIconSet(iconMap: Record<string, any>, prefixVariants: string[] = []) {
  const IconComponent: React.FC<any> & { glyphMap: Record<string, string> } = ({ name, size = 24, color = 'currentColor', style, onClick, onPress, ...props }) => {
    if (!name) return null;

    const pascalName = toPascalCase(name);
    let FoundIcon = iconMap[name] || iconMap[pascalName];

    if (!FoundIcon) {
      for (const prefix of prefixVariants) {
        const testName = `${prefix}${pascalName}`;
        if (iconMap[testName]) {
          FoundIcon = iconMap[testName];
          break;
        }
      }
    }

    const cssStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      color,
      fontSize: size,
      cursor: onPress || onClick ? 'pointer' : undefined,
      ...processStyle(style),
    };

    if (FoundIcon) {
      return (
        <span style={cssStyle} onClick={onPress || onClick} {...props}>
          <FoundIcon size={size} color={color} />
        </span>
      );
    }

    return (
      <span style={cssStyle} onClick={onPress || onClick} {...props}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
        </svg>
      </span>
    );
  };

  IconComponent.glyphMap = (iconMap as any) || {};
  return IconComponent;
}

export const Ionicons = createIconSet(IoIcons, ['Io', 'Io5']);
export const Feather = createIconSet(FiIcons, ['Fi']);
export const MaterialIcons = createIconSet(MdIcons, ['Md']);
export const FontAwesome = createIconSet(FaIcons, ['Fa']);
export const MaterialCommunityIcons = createIconSet(MdIcons, ['Mci', 'Md']);
export const AntDesign = createIconSet(AiIcons, ['Ai']);
export const SimpleLineIcons = createIconSet(FiIcons, ['Fi']);
export const Entypo = createIconSet(IoIcons, ['Io']);
export const Octicons = createIconSet(FiIcons, ['Fi']);

export default {
  Ionicons,
  Feather,
  MaterialIcons,
  FontAwesome,
  MaterialCommunityIcons,
  AntDesign,
  SimpleLineIcons,
  Entypo,
  Octicons,
};
