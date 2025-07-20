module.exports = {
  // 소스 파일 경로 패턴
  input: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/i18n/**',
    '!**/node_modules/**'
  ],

  // 번역 파일 출력 경로
  output: 'public/locales/$LOCALE/$NAMESPACE.json',

  // 지원할 언어 목록
  locales: ['en', 'ko', 'ja'],

  // 기본 네임스페이스
  defaultNamespace: 'translation',

  // 네임스페이스 목록
  namespaces: ['translation'],

  // 기본 언어 (키가 없을 때 사용할 언어)
  defaultValue: function (lng, ns, key) {
    // 영어가 기본이므로 키 자체를 기본값으로 사용
    if (lng === 'en') {
      return key;
    }
    // 다른 언어는 빈 문자열로 설정하여 번역이 필요함을 표시
    return '';
  },

  // 키 구분자 (중첩 객체 지원)
  keySeparator: '.',

  // 네임스페이스 구분자 비활성화 (콜론 포함 키 문제 해결)
  nsSeparator: false,

  // 번역 함수 이름들
  func: {
    list: ['t', 'i18next.t', 'i18n.t'],
    extensions: ['.js', '.jsx']
  },

  // Trans 컴포넌트 설정
  trans: {
    component: 'Trans',
    i18nKey: 'i18nKey',
    defaultsKey: 'defaults',
    extensions: ['.js', '.jsx'],
    fallbackKey: function (ns, value) {
      return value;
    }
  },

  // 기존 번역 파일 유지 설정
  resetDefaultValueLocale: null,

  // 사용되지 않는 키 제거
  removeUnusedKeys: false,

  // 정렬 설정
  sort: true,

  // 들여쓰기 설정
  indentation: 2,

  // 줄바꿈 문자
  lineEnding: 'lf',

  // 파일 끝에 줄바꿈 추가
  finalNewline: true,

  // 키 생성 시 사용할 패턴
  createOldCatalogs: false,

  // 기존 번역 유지
  keepRemoved: false,

  // 번역 키 추출 시 무시할 패턴
  ignoredKeys: [
    // 동적으로 생성되는 키들은 무시
    /^__/,
    // 테스트 관련 키들은 무시
    /test/i
  ],

  // 커스텀 변환 함수는 제거하고 기본 파서 사용
};
