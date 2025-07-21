const fs = require('fs');

module.exports = {
  input: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/i18n/**',
    '!**/node_modules/**'
  ],

  output: './public/locales',

  options: {
    debug: false,
    removeUnusedKeys: false,
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

    // 기본값 설정 - 영어는 키 자체를 값으로 사용
    defaultValue: function (lng, _ns, key) {
      return lng === 'en' ? key : '';
    },

    resource: {
      loadPath: '{{lng}}/{{ns}}.json',
      savePath: '{{lng}}/{{ns}}.json',
      jsonIndent: 2,
      lineEnding: '\n'
    },

    interpolation: {
      prefix: '{{',
      suffix: '}}'
    }
  },

  // 커스텀 변환 함수 - 모든 특수문자가 포함된 키 허용
  transform: function (file, enc, done) {
    'use strict';
    const parser = this.parser;
    const content = fs.readFileSync(file.path, enc);

    // t() 함수 호출을 찾는 정규식 (모든 특수문자 허용)
    const regex = /\bt\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const key = match[1];

      // 플랫 구조로 키 저장 (점, 콜론, 느낌표 등 모든 문자 허용)
      parser.set(key, key, {
        nsSeparator: false,
        keySeparator: false
      });
    }

    done();
  }
};
