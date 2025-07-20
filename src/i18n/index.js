import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
  // HTTP 백엔드로 번역 파일 로드
  .use(HttpBackend)
  // 브라우저 언어 감지
  .use(LanguageDetector)
  // React i18next 연결
  .use(initReactI18next)
  // 초기화
  .init({
    // 기본 언어 설정
    fallbackLng: 'ko',
    lng: 'ko', // 기본 언어를 한국어로 설정

    // 언어 감지 설정
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    // HTTP 백엔드 설정
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // 네임스페이스 설정
    ns: ['translation'],
    defaultNS: 'translation',

    // 보간 설정
    interpolation: {
      escapeValue: false, // React는 XSS를 자동으로 방지
    },

    // 개발 모드 설정
    debug: process.env.NODE_ENV === 'development',

    // React 설정
    react: {
      useSuspense: false, // Suspense 사용 안 함 (호환성을 위해)
    },

    // 키가 없을 때 키 자체를 반환
    returnKeyIfNotFound: true,
    returnEmptyString: false,
  });

export default i18n;
