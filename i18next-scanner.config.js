module.exports = {
  input: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/i18n/**',
    '!**/node_modules/**'
  ],

  options: {
    debug: false,
    removeUnusedKeys: true,  // 사용하지 않는 키 자동 삭제
    sort: true,

    func: {
      list: ['t', 'i18next.t', 'i18n.t'],
      extensions: ['.js', '.jsx']
    },

    trans: {
      component: 'Trans',
      i18nKey: 'i18nKey',
      defaultsKey: 'defaults',
      extensions: ['.js', '.jsx']
    },

    lngs: ['en', 'ko', 'ja'],
    defaultLng: 'en',
    defaultNs: 'translation',

    // 모든 특수문자 허용 - 키 구분자 완전 비활성화
    keySeparator: false,
    nsSeparator: false,

    // 기본값 설정 - 새로운 키에만 적용 (기존 키는 keepRemoved로 보존)
    defaultValue: function (lng, _ns, key) {
      // 영어는 키 자체를 값으로, 다른 언어는 빈 문자열
      return lng === 'en' ? key : '';
    },

    resource: {
      loadPath: './public/locales/{{lng}}/{{ns}}.json',
      savePath: './public/locales/{{lng}}/{{ns}}.json',
      jsonIndent: 2,
      lineEnding: '\n'
    },

    interpolation: {
      prefix: '{{',
      suffix: '}}'
    }
  },

  // 기본 transform 함수 사용 (merge 기능 내장)
};
