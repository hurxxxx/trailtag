import { formatDistanceToNow } from 'date-fns';
import { ko, enUS, ja } from 'date-fns/locale';
import { getFormatString } from '../data/timeFormats';

// 로케일 매핑
const localeMap = {
  ko: ko,
  en: enUS,
  ja: ja
};

/**
 * 사용자의 언어와 타임존에 맞게 날짜를 포맷팅
 * @param {string|Date} date - 날짜 문자열 또는 Date 객체
 * @param {string} formatString - date-fns 포맷 문자열
 * @param {string} userTimezone - 사용자 타임존 (예: 'Asia/Seoul')
 * @param {string} userLocale - 사용자 언어 (예: 'ko', 'en', 'ja')
 * @returns {string} 포맷된 날짜 문자열
 */
export const formatDateWithTimezone = (date, formatString, userTimezone = 'Asia/Seoul', userLocale = 'ko') => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const localeString = userLocale === 'ko' ? 'ko-KR' :
      userLocale === 'ja' ? 'ja-JP' : 'en-US';

    return dateObj.toLocaleString(localeString, {
      timeZone: userTimezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid Date';
  }
};

/**
 * 상대적 시간 표시 (예: "2시간 전", "3일 전")
 * @param {string|Date} date - 날짜 문자열 또는 Date 객체
 * @param {string} userTimezone - 사용자 타임존
 * @param {string} userLocale - 사용자 언어
 * @returns {string} 상대적 시간 문자열
 */
export const formatTimeAgo = (date, userTimezone = 'Asia/Seoul', userLocale = 'ko') => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const locale = localeMap[userLocale] || ko;

    return formatDistanceToNow(dateObj, {
      addSuffix: true,
      locale
    });
  } catch (error) {
    console.error('Time ago formatting error:', error);
    return 'Invalid Date';
  }
};

/**
 * 날짜만 표시 (예: "2025년 1월 21일", "Jan 21, 2025")
 * @param {string|Date} date - 날짜
 * @param {string} userTimezone - 사용자 타임존
 * @param {string} userLocale - 사용자 언어
 * @param {string} dateFormat - 사용자 날짜 포맷 설정 (선택사항)
 * @returns {string} 포맷된 날짜
 */
export const formatDate = (date, userTimezone = 'Asia/Seoul', userLocale = 'ko', dateFormat = null) => {
  let formatString;

  if (dateFormat) {
    formatString = getFormatString(userLocale, 'date', dateFormat);
  } else {
    // 기본 포맷
    formatString = userLocale === 'ko' ? 'yyyy년 M월 d일' :
      userLocale === 'ja' ? 'yyyy年M月d日' :
        'MMM d, yyyy';
  }

  return formatDateWithTimezone(date, formatString, userTimezone, userLocale);
};

/**
 * 시간만 표시 (예: "오후 2:30", "2:30 PM")
 * @param {string|Date} date - 날짜
 * @param {string} userTimezone - 사용자 타임존
 * @param {string} userLocale - 사용자 언어
 * @param {string} timeFormat - 사용자 시간 포맷 설정 (선택사항)
 * @returns {string} 포맷된 시간
 */
export const formatTime = (date, userTimezone = 'Asia/Seoul', userLocale = 'ko', timeFormat = null) => {
  let formatString;

  if (timeFormat) {
    formatString = getFormatString(userLocale, 'time', timeFormat);
  } else {
    // 기본 포맷
    formatString = userLocale === 'ko' ? 'a h:mm' :
      userLocale === 'ja' ? 'aaa h:mm' :
        'h:mm a';
  }

  return formatDateWithTimezone(date, formatString, userTimezone, userLocale);
};

/**
 * 날짜와 시간 모두 표시 (예: "2025년 1월 21일 오후 2:30")
 * @param {string|Date} date - 날짜
 * @param {string} userTimezone - 사용자 타임존
 * @param {string} userLocale - 사용자 언어
 * @param {string} dateFormat - 사용자 날짜 포맷 설정 (선택사항)
 * @param {string} timeFormat - 사용자 시간 포맷 설정 (선택사항)
 * @returns {string} 포맷된 날짜시간
 */
export const formatDateTime = (date, userTimezone = 'Asia/Seoul', userLocale = 'ko', dateFormat = null, timeFormat = null) => {
  let formatString;

  if (dateFormat && timeFormat) {
    const dateFormatStr = getFormatString(userLocale, 'date', dateFormat);
    const timeFormatStr = getFormatString(userLocale, 'time', timeFormat);
    formatString = `${dateFormatStr} ${timeFormatStr}`;
  } else {
    // 기본 포맷
    formatString = userLocale === 'ko' ? 'yyyy년 M월 d일 a h:mm' :
      userLocale === 'ja' ? 'yyyy年M月d日 aaa h:mm' :
        'MMM d, yyyy h:mm a';
  }

  return formatDateWithTimezone(date, formatString, userTimezone, userLocale);
};

/**
 * 현재 시간을 사용자 타임존으로 변환
 * @param {string} userTimezone - 사용자 타임존
 * @returns {Date} 타임존이 적용된 현재 시간
 */
export const getCurrentTimeInTimezone = (userTimezone = 'Asia/Seoul') => {
  return new Date(); // 네이티브 Date 객체 반환 (브라우저가 자동으로 시간대 처리)
};

/**
 * 사용자 입력 시간을 UTC로 변환 (서버 저장용)
 * @param {Date} localDate - 로컬 날짜
 * @param {string} userTimezone - 사용자 타임존
 * @returns {Date} UTC 날짜
 */
export const convertToUTC = (localDate, userTimezone = 'Asia/Seoul') => {
  return zonedTimeToUtc(localDate, userTimezone);
};
