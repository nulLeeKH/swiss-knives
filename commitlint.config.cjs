module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'int', // internal
        'ftr', // feature
        'fix', // fix
        'doc', // docs
        'stl', // style
        'rfc', // refactor
        'tst', // test
        'chr', // chore
        'rvt', // revert
        'bld', // build
        'cid', // ci/cd
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    // 'scope-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 72],
  },
};
