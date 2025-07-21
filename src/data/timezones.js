/**
 * 전 세계 주요 시간대 목록
 * IANA 시간대 식별자 기준
 */
export const timezones = [
  // 아시아/태평양
  { value: 'Asia/Seoul', label: 'Seoul (UTC+9)', region: 'Asia' },
  { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)', region: 'Asia' },
  { value: 'Asia/Shanghai', label: 'Shanghai (UTC+8)', region: 'Asia' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (UTC+8)', region: 'Asia' },
  { value: 'Asia/Singapore', label: 'Singapore (UTC+8)', region: 'Asia' },
  { value: 'Asia/Bangkok', label: 'Bangkok (UTC+7)', region: 'Asia' },
  { value: 'Asia/Jakarta', label: 'Jakarta (UTC+7)', region: 'Asia' },
  { value: 'Asia/Dhaka', label: 'Dhaka (UTC+6)', region: 'Asia' },
  { value: 'Asia/Kolkata', label: 'Mumbai/Delhi (UTC+5:30)', region: 'Asia' },
  { value: 'Asia/Dubai', label: 'Dubai (UTC+4)', region: 'Asia' },
  { value: 'Asia/Riyadh', label: 'Riyadh (UTC+3)', region: 'Asia' },

  // 오세아니아
  { value: 'Australia/Sydney', label: 'Sydney (UTC+11)', region: 'Oceania' },
  { value: 'Australia/Melbourne', label: 'Melbourne (UTC+11)', region: 'Oceania' },
  { value: 'Australia/Perth', label: 'Perth (UTC+8)', region: 'Oceania' },
  { value: 'Pacific/Auckland', label: 'Auckland (UTC+13)', region: 'Oceania' },

  // 유럽
  { value: 'Europe/London', label: 'London (UTC+0)', region: 'Europe' },
  { value: 'Europe/Paris', label: 'Paris (UTC+1)', region: 'Europe' },
  { value: 'Europe/Berlin', label: 'Berlin (UTC+1)', region: 'Europe' },
  { value: 'Europe/Rome', label: 'Rome (UTC+1)', region: 'Europe' },
  { value: 'Europe/Madrid', label: 'Madrid (UTC+1)', region: 'Europe' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (UTC+1)', region: 'Europe' },
  { value: 'Europe/Zurich', label: 'Zurich (UTC+1)', region: 'Europe' },
  { value: 'Europe/Vienna', label: 'Vienna (UTC+1)', region: 'Europe' },
  { value: 'Europe/Stockholm', label: 'Stockholm (UTC+1)', region: 'Europe' },
  { value: 'Europe/Moscow', label: 'Moscow (UTC+3)', region: 'Europe' },
  { value: 'Europe/Istanbul', label: 'Istanbul (UTC+3)', region: 'Europe' },

  // 아프리카
  { value: 'Africa/Cairo', label: 'Cairo (UTC+2)', region: 'Africa' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (UTC+2)', region: 'Africa' },
  { value: 'Africa/Lagos', label: 'Lagos (UTC+1)', region: 'Africa' },
  { value: 'Africa/Casablanca', label: 'Casablanca (UTC+1)', region: 'Africa' },

  // 북미
  { value: 'America/New_York', label: 'New York (UTC-5)', region: 'North America' },
  { value: 'America/Chicago', label: 'Chicago (UTC-6)', region: 'North America' },
  { value: 'America/Denver', label: 'Denver (UTC-7)', region: 'North America' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8)', region: 'North America' },
  { value: 'America/Toronto', label: 'Toronto (UTC-5)', region: 'North America' },
  { value: 'America/Vancouver', label: 'Vancouver (UTC-8)', region: 'North America' },
  { value: 'America/Mexico_City', label: 'Mexico City (UTC-6)', region: 'North America' },

  // 남미
  { value: 'America/Sao_Paulo', label: 'São Paulo (UTC-3)', region: 'South America' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (UTC-3)', region: 'South America' },
  { value: 'America/Lima', label: 'Lima (UTC-5)', region: 'South America' },
  { value: 'America/Bogota', label: 'Bogotá (UTC-5)', region: 'South America' },
  { value: 'America/Santiago', label: 'Santiago (UTC-4)', region: 'South America' },

  // UTC
  { value: 'UTC', label: 'UTC (UTC+0)', region: 'UTC' }
];

/**
 * 지역별로 그룹화된 시간대 반환
 */
export const getTimezonesByRegion = () => {
  const grouped = {};

  timezones.forEach(tz => {
    if (!grouped[tz.region]) {
      grouped[tz.region] = [];
    }
    grouped[tz.region].push(tz);
  });

  return grouped;
};

/**
 * 지역별 시간대 객체 (ProfileEditor 호환성)
 */
export const timezonesByRegion = (() => {
  const grouped = {};

  timezones.forEach(tz => {
    if (!grouped[tz.region]) {
      grouped[tz.region] = [];
    }
    grouped[tz.region].push({ value: tz.value, label: tz.label });
  });

  return grouped;
})();

/**
 * 시간대 값으로 라벨 찾기
 */
export const getTimezoneLabel = (value) => {
  const timezone = timezones.find(tz => tz.value === value);
  return timezone ? timezone.label : value;
};

/**
 * 현재 브라우저의 시간대 감지
 */
export const detectUserTimezone = () => {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const found = timezones.find(tz => tz.value === detected);
    return found ? detected : 'Asia/Seoul'; // 기본값
  } catch (error) {
    console.warn('Timezone detection failed:', error);
    return 'Asia/Seoul'; // 기본값
  }
};
