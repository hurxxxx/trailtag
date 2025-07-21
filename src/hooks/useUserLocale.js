import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { getDefaultFormats } from '../data/timeFormats';

/**
 * 사용자의 언어, 타임존, 시간 포맷 정보를 제공하는 훅
 * @returns {Object} 사용자 로케일 정보
 */
export const useUserLocale = () => {
  const { user } = useAuth();
  const { i18n } = useTranslation();

  // 사용자 언어 (프로필 설정 > i18n 현재 언어 > 기본값 'ko')
  const userLanguage = user?.language || i18n.language || 'ko';

  // 사용자 타임존 (프로필 설정 > 기본값 'Asia/Seoul')
  const userTimezone = user?.timezone || 'Asia/Seoul';

  // 사용자 시간/날짜 포맷 (프로필 설정 > 기본값)
  const defaultFormats = getDefaultFormats(userLanguage);
  const userTimeFormat = user?.timeFormat || defaultFormats.timeFormat;
  const userDateFormat = user?.dateFormat || defaultFormats.dateFormat;

  return {
    language: userLanguage,
    timezone: userTimezone,
    timeFormat: userTimeFormat,
    dateFormat: userDateFormat,
    user
  };
};
