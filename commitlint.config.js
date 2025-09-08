module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 100],
    'scope-enum': [
      2,
      'always',
      [
        'frontend',
        'backend',
        'docs',
        'tests',
        'chore',
        'refactor',
        'style',
        'fix',
        'feat',
      ],
    ],
    'branch-name': [2, 'always', ['^feat/', '^fix/', '^docs/']],
  },
};
