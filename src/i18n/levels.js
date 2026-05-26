const LEVEL_KEYS = {
  'مبتدئ': 'beginner',
  'متوسط': 'intermediate',
  'متقدم': 'advanced',
  'كل المستويات': 'all',
  beginner: 'beginner',
  intermediate: 'intermediate',
  advanced: 'advanced',
  all: 'all',
};

export function getLevelKey(level) {
  return LEVEL_KEYS[level] || 'beginner';
}

export function levelLabel(level, t) {
  const key = getLevelKey(level);
  return t(`levels.${key}`);
}

export const LEVEL_OPTIONS = ['beginner', 'intermediate', 'advanced', 'all'];
