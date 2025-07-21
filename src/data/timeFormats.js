/**
 * 시간 포맷 옵션들
 */
export const timeFormats = {
  ko: [
    { value: '12h', label: '12시간 형식 (오후 2:30)', format: 'a h:mm' },
    { value: '24h', label: '24시간 형식 (14:30)', format: 'HH:mm' }
  ],
  en: [
    { value: '12h', label: '12-hour format (2:30 PM)', format: 'h:mm a' },
    { value: '24h', label: '24-hour format (14:30)', format: 'HH:mm' }
  ],
  ja: [
    { value: '12h', label: '12時間形式 (午後 2:30)', format: 'aaa h:mm' },
    { value: '24h', label: '24時間形式 (14:30)', format: 'HH:mm' }
  ]
};

/**
 * 날짜 포맷 옵션들
 */
export const dateFormats = {
  ko: [
    { value: 'long', label: '긴 형식 (2025년 1월 21일)', format: 'yyyy년 M월 d일' },
    { value: 'short', label: '짧은 형식 (2025.1.21)', format: 'yyyy.M.d' },
    { value: 'iso', label: 'ISO 형식 (2025-01-21)', format: 'yyyy-MM-dd' }
  ],
  en: [
    { value: 'long', label: 'Long format (January 21, 2025)', format: 'MMMM d, yyyy' },
    { value: 'short', label: 'Short format (Jan 21, 2025)', format: 'MMM d, yyyy' },
    { value: 'iso', label: 'ISO format (2025-01-21)', format: 'yyyy-MM-dd' }
  ],
  ja: [
    { value: 'long', label: '長い形式 (2025年1月21日)', format: 'yyyy年M月d日' },
    { value: 'short', label: '短い形式 (2025/1/21)', format: 'yyyy/M/d' },
    { value: 'iso', label: 'ISO形式 (2025-01-21)', format: 'yyyy-MM-dd' }
  ]
};

/**
 * 언어별 기본 포맷 가져오기
 */
export const getDefaultFormats = (language) => {
  return {
    timeFormat: timeFormats[language]?.[0]?.value || '12h',
    dateFormat: dateFormats[language]?.[0]?.value || 'long'
  };
};

/**
 * 포맷 값으로 실제 포맷 문자열 가져오기
 */
export const getFormatString = (language, type, value) => {
  const formats = type === 'time' ? timeFormats : dateFormats;
  const format = formats[language]?.find(f => f.value === value);
  return format?.format || (type === 'time' ? 'h:mm a' : 'MMM d, yyyy');
};
