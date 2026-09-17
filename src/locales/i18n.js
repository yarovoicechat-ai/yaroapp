import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resources } from './translations';

const LANGUAGE_DETECTOR = {
    type: 'languageDetector',
    async: true,
    detect: (callback) => {
        AsyncStorage.getItem('language').then((language) => {
            // Map the full names to language codes
            const langMap = {
                'English': 'en',
                'Hindi': 'hi',
                'Bengali': 'bn',
                'Arabic': 'ar',
                'Urdu': 'ur',
            };

            const code = langMap[language] || 'en';
            callback(code);
        }).catch(() => {
            callback('en');
        });
    },
    init: () => { },
    cacheUserLanguage: () => { },
};

i18n
    .use(LANGUAGE_DETECTOR)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        react: {
            useSuspense: false, // Prevents warning since we don't use React Suspense natively
        },
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
