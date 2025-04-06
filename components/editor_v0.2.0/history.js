/* =============================================================================
CONSTS / CONFIGS / GENERAL ITEMS
============================================================================= */
// #ref: ./script.js
const OS = detectOS();
const IS_MAC = OS === OS_MAC; // eslint-disable-line no-use-before-define
const IS_SAFARI = isSafari(); // eslint-disable-line no-use-before-define

const MAX_HISTORY = 100; // Maximum number of history states to keep
let historyStack = []; // History stack
/* =============================================================================
UNDO FUNCTIONALITY (HISTORY)
============================================================================= */
editor.addEventListener('keydown', (e) => {
  // Restore history state
  if (
    ((IS_MAC && e.metaKey && !e.ctrlKey) ||
      (!IS_MAC && e.ctrlKey && !e.metaKey)) &&
    e.key.toLowerCase() === 'z'
  ) {
    e.preventDefault();

    // Check availability
    if (historyStack.length > 0) {
      const lastState = historyStack[historyStack.length - 2];
      historyStack.pop();

      if (lastState !== undefined) editor.innerHTML = lastState;
      else editor.innerHTML = '';

      // const selection = window.getSelection();
      // const range = selection.getRangeAt(0);
      // range.collapse(true);
    }
  }
});

// editor.addEventListener(
//   'input',
//   debounce(() => {
//     const msg = editor.innerHTML;
//     pushHistory(msg);
//   }, 250)
// );

// When the user's draft is restored after page load
document.addEventListener('DOMContentLoaded', () => {
  const msg = editor.innerHTML;
  pushHistory(msg);
});

/**
 * @param {string} state
 * @description Push the current state to history.
 */
function pushHistory(state) {
  if (historyStack.length && historyStack[historyStack.length - 1] === state) {
    return;
  }
  historyStack.push(state);
  if (historyStack.length > MAX_HISTORY) {
    // Remove the oldest entry when maximum history is exceeded
    historyStack.shift();
  }
}
/* =============================================================================
OBSERVER
============================================================================= */
const handleMutations = debounce(() => {
  const msg = editor.innerHTML;
  pushHistory(msg);
}, 500);

const observer = new MutationObserver(() => {
  handleMutations();
});

observer.observe(editor, {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
});
// =============================================================================
