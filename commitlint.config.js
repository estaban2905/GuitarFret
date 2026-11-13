export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'style', 'test', 'docs', 'chore', 'perf']
    ],
    'subject-case': [0]
  }
};
