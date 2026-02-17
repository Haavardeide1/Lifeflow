'use client';

import {
  Footprints,
  Dumbbell,
  Phone,
  BookOpen,
  Brain,
  Monitor,
  EyeOff,
  Beer,
  Heart,
  Moon,
  Coffee,
  Cigarette,
  Music,
  Utensils,
  Droplets,
  Sun,
  Smile,
  Frown,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  'footprints': Footprints,
  'dumbbell': Dumbbell,
  'phone': Phone,
  'book-open': BookOpen,
  'brain': Brain,
  'monitor': Monitor,
  'eye-off': EyeOff,
  'beer': Beer,
  'heart': Heart,
  'moon': Moon,
  'coffee': Coffee,
  'cigarette': Cigarette,
  'music': Music,
  'utensils': Utensils,
  'droplets': Droplets,
  'sun': Sun,
  'smile': Smile,
  'frown': Frown,
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

interface HabitIconProps {
  icon: string;
  size?: number;
  className?: string;
}

export function HabitIcon({ icon, size = 20, className = '' }: HabitIconProps) {
  const Icon = ICON_MAP[icon] || Heart;
  return <Icon size={size} className={className} />;
}
