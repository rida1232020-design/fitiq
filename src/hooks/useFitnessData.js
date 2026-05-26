import { useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { exercisesData } from '../i18n/exercisesData';

export function useFitnessData() {
  const { language } = useLanguage();
  return useMemo(() => exercisesData[language] || exercisesData.ar, [language]);
}
