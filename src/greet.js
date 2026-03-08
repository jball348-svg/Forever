/**
 * Returns the Forever welcome message as a string.
 * @returns {string}
 */
function greet() {
  const lines = [
    '=========================================',
    '  Welcome to Forever',
    '=========================================',
    '',
    '  Forever is a self-evolving repository.',
    '  With each iteration, it grows smarter,',
    '  more structured, and more capable.',
    '',
    '  The journey never ends.',
    '=========================================',
  ];
  return lines.join('\n');
}

module.exports = { greet };
