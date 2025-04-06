/* =============================================================================
GENERAL VARIABLES / UTILITY_FUNCTIONS
============================================================================= */
const SPOILER_ALERT_MSG = 'SPOILER';

const sampleMessages = [
  'Hey, how are you doing?',
  "Let's catch up later.",
  'Did you check out the news today?',
  "I'll call you back shortly.",
  'Can you send me the file?',
  'What do you think about our project?',
  "I'm on my way.",
  'That sounds great!',
  'See you soon.',
  'Thank you for your help.',
];

/**
 * @param {number} min
 * @param {number} max
 * @returns {number}
 * @description Generate random number
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * @param {requestCallback} func
 * @param {number} wait
 * @returns {function}
 * @description Debounce function for performance optimization
 */
function debounce(func, wait) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}
/* =============================================================================
OS & BROWSER
============================================================================= */
const OS_MAC = 'macOS';
const OS_WIN = 'Windows';
const OS_LIN = 'Linux';
const OS_OTHER = 'Other';

/**
 * @returns {"macOS" | "Windows" | "Linux" | "Other"}
 * @description Detect user's OS
 */
function detectOS() {
  let platform = '';
  let pl = null;
  let ua = null;
  let uad = null;

  try {
    pl = navigator.platform.toLowerCase(); // Deprecated: for older browsers
  } catch (e) {}

  try {
    ua = navigator.userAgent.toLowerCase();
  } catch (e) {}

  try {
    uad = navigator.userAgentData.platform.toLowerCase();
  } catch (e) {}

  if (pl) platform = pl;
  else if (uad) platform = uad;
  else if (ua) platform = ua;

  if (platform.indexOf('mac') !== -1) {
    platform = OS_MAC;
  } else if (platform.indexOf('win') !== -1) {
    platform = OS_WIN;
  } else if (platform.indexOf('linux') !== -1) {
    platform = OS_LIN;
  } else {
    platform = OS_OTHER;
  }
  return platform;
}

/**
 * @returns {boolean}
 * @description Checks whether the user's browser is Safari or not.
 */
function isSafari() {
  const os = detectOS();
  let ua = null;
  let isSafari = false;

  try {
    ua = navigator.userAgent.toLowerCase();
  } catch (e) {}

  if (os === OS_MAC) {
    isSafari =
      ua.indexOf('safari') !== -1 &&
      ua.indexOf('firefox') === -1 &&
      ua.indexOf('chrome') === -1 &&
      ua.indexOf('chromium') === -1;
  }

  return isSafari;
}
// =============================================================================
