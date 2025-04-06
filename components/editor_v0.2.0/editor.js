/* =============================================================================
CONSTS / CONFIGS / GENERAL ITEMS
============================================================================= */
const editor = document.getElementById('editor');
const menu = document.getElementById('formatting-menu');
const urlForm = document.getElementById('url-input-form');
const urlInput = document.getElementById('url-input');

// Track selection state
let lastSelection = null;

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

/**
 * @returns null
 * @description Select a specific node
 */
function selectNode(node) {
  const range = document.createRange();
  range.selectNodeContents(node);

  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

// Handle enter key to insert br instead of div
editor.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      // Create and insert line break
      if (editor.contains(range.commonAncestorContainer)) {
        // Cancel the default action
        e.preventDefault();

        for (let i = 0; i < 2; i++) {
          const br = document.createElement('br'); // Create br element
          range.deleteContents(); // Delete any selected content first
          range.insertNode(br); // Insert the br

          // Move cursor after the br
          range.setStartAfter(br);
          range.setEndAfter(br);

          range.selectNode(br);
          range.collapse(false);
        }

        // Update selection
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }
  return false;
});
/* =============================================================================
TEXT SELECTION
============================================================================= */
/**
 * @returns null
 * @description Check text selection
 */
const checkSelection = debounce(() => {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);

  // Only show menu if text is selected within the editor
  if (
    editor.contains(range.commonAncestorContainer) &&
    selection.toString().trim() !== ''
  ) {
    showMenu();
    lastSelection = saveSelection();
  } else {
    hideMenu();
  }
}, 250);

/**
 * @returns null
 * @description Save the current selection state
 */
function saveSelection() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    return selection.getRangeAt(0).cloneRange();
  }
  return null;
}

/**
 * @returns null
 * @param {object} savedSelection
 * @description Restore a saved selection
 */
function restoreSelection(savedSelection) {
  if (savedSelection) {
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedSelection);
  }
}
/* =============================================================================
FORMATING MENU (SHOW / HIDE)
============================================================================= */
/**
 * @returns null
 * @description Show the formatting menu
 */
function showMenu() {
  const editorRect = editor.getBoundingClientRect();
  menu.style.width = editorRect.width + 'px';
  menu.classList.add('active');
}

/**
 * @returns null
 * @description Hide the formatting menu
 */
function hideMenu() {
  menu.classList.remove('active');
}

// Show formatting menu when text is selected
editor.addEventListener('mouseup', checkSelection);
editor.addEventListener('keyup', checkSelection);

// Hide menu when clicking outside the editor
document.addEventListener('mousedown', (e) => {
  if (!editor.contains(e.target) && !menu.contains(e.target)) {
    hideMenu();
  }
});
/* =============================================================================
FORMATING MENU (LINK)
============================================================================= */
/**
 * @returns null
 * @description Show URL input form
 */
function showUrlForm() {
  menu.classList.remove('active'); // Hide the formatting menu
  urlForm.classList.add('active'); // Show the URL input form
  urlInput.focus(); // Focus on the URL input field
}

/**
 * @returns null
 * @description Hide URL input form
 */
function hideUrlForm() {
  urlForm.classList.remove('active'); // Hide the URL input form
  urlInput.value = ''; // Clear the input field
}

/**
 * @returns null
 * @description Cancel URL input
 */
function cancelUrl() {
  if (window._linkSelectionContent && window._linkRange) {
    // Just reinsert the content without formatting
    window._linkRange.insertNode(window._linkSelectionContent);
  }

  // Clean up
  window._linkSelectionContent = null;
  window._linkRange = null;

  // Hide the URL form
  hideUrlForm();
}

/**
 * @returns null
 * @description Handle URL submission
 */
function submitUrl() {
  const url = urlInput.value.trim();

  if (url && window._linkSelectionContent && window._linkRange) {
    // Create link element
    const linkElement = document.createElement('a');
    linkElement.href = url;

    // Add the previously saved content to the link element
    linkElement.appendChild(window._linkSelectionContent);

    // Insert the link element
    window._linkRange.insertNode(linkElement);

    // Update selection
    selectNode(linkElement);

    // Update last selection reference
    lastSelection = saveSelection();
  } else if (window._linkSelectionContent && window._linkRange) {
    // If no URL provided, just return the content without formatting
    window._linkRange.insertNode(window._linkSelectionContent);
  }

  // Clean up
  window._linkSelectionContent = null;
  window._linkRange = null;

  // Hide the URL form
  hideUrlForm();
}

/**
 * @returns null
 * @description Handle keyboard events in the URL input
 */
function handleUrlInputKey(event) {
  if (event.key === 'Enter') {
    // Submit when Enter is pressed
    event.preventDefault();
    submitUrl();
  } else if (event.key === 'Escape') {
    // Cancel when Escape is pressed
    event.preventDefault();
    cancelUrl();
  }
}
/* =============================================================================
TOGGLE FORMAT (APPLY / REMOVE)
============================================================================= */
/**
 * @returns null
 * @param {string} type
 * @description Apply formatting to selected text
 */
function formatText(type) {
  // Restore previous selection if it exists
  if (lastSelection) {
    restoreSelection(lastSelection);
  }

  const selection = window.getSelection();
  if (selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  if (range.collapsed) return; // No text selected

  // Check if the tag already exists on the selection
  const isFormatted = checkFormatting(type, range);

  if (isFormatted) {
    removeFormatting(type, range);
  } else {
    applyFormatting(type, range);
  }

  // Update selection reference
  lastSelection = saveSelection();
}

/**
 * @returns null
 * @param {string} type
 * @param {object} range
 * @description Check if the selected text already has formatting
 */
function checkFormatting(type, range) {
  const tagNames = {
    bold: 'B',
    italic: 'I',
    underline: 'U',
    strikeout: 'S',
    quote: 'Q',
    marked: 'MARK',
    monospace: 'CODE',
    link: 'A',
  };

  // Get the common ancestor container
  let container = range.commonAncestorContainer;

  // If it's a text node, get its parent
  if (container.nodeType === 3) {
    container = container.parentNode;
  }

  // Special cases for spoiler and link
  if (type === 'spoiler') {
    return container.classList && container.classList.contains('spoiler');
  } else if (type === 'link') {
    return container.tagName === 'A';
  }

  // Check if the selection is already wrapped with the tag
  let node = container;
  while (node && node !== editor) {
    if (node.nodeName === tagNames[type]) {
      return true;
    }
    node = node.parentNode;
  }

  return false;
}

/**
 * @returns null
 * @param {string} type
 * @param {object} range
 * @description Apply formatting to the selected text
 */
function applyFormatting(type, range) {
  // Extract the selected content
  const selectedContent = range.extractContents();
  let formattedElement;

  if (type === 'spoiler') {
    formattedElement = document.createElement('span');
    formattedElement.className = 'spoiler';
  } else if (type === 'marked') {
    formattedElement = document.createElement('mark');
  } else if (type === 'bold') {
    formattedElement = document.createElement('b');
  } else if (type === 'italic') {
    formattedElement = document.createElement('i');
  } else if (type === 'underline') {
    formattedElement = document.createElement('u');
  } else if (type === 'strikeout') {
    formattedElement = document.createElement('s');
  } else if (type === 'quote') {
    formattedElement = document.createElement('q');
  } else if (type === 'monospace') {
    formattedElement = document.createElement('code');
  } else if (type === 'link') {
    // For links, we'll show the URL input form first
    // and handle the actual formatting in a separate function
    showUrlForm();
    // Save the current selection and content for later use
    window._linkSelectionContent = selectedContent;
    window._linkRange = range;
    // Return early as we'll complete the formatting after URL submission
    return;
  }

  // Add the selected content to the new element
  formattedElement.appendChild(selectedContent);

  // Insert the new element
  range.insertNode(formattedElement);

  // Update selection
  selectNode(formattedElement);
}

/**
 * @returns null
 * @param {string} type
 * @param {object} range
 * @description Remove formatting from the selected text
 */
function removeFormatting(type, range) {
  // Find the formatting element to remove
  let container = range.commonAncestorContainer;
  if (container.nodeType === 3) {
    container = container.parentNode;
  }
  let formattedElement = container;

  const tagNames = {
    bold: 'B',
    italic: 'I',
    underline: 'U',
    strikeout: 'S',
    quote: 'Q',
    marked: 'MARK',
    monospace: 'CODE',
    link: 'A',
  };

  // For spoiler, look for a span with spoiler class
  if (type === 'spoiler') {
    while (
      formattedElement &&
      !(
        formattedElement.nodeName === 'SPAN' &&
        formattedElement.classList.contains('spoiler')
      )
    ) {
      if (formattedElement === editor) {
        return; // No spoiler found
      }
      formattedElement = formattedElement.parentNode;
    }
  } else if (type === 'link') {
    // For links, look for an A tag
    while (formattedElement && formattedElement.nodeName !== 'A') {
      if (formattedElement === editor) {
        return; // No link found
      }
      formattedElement = formattedElement.parentNode;
    }
  } else {
    // For other types, look for the specific tag
    while (formattedElement && formattedElement.nodeName !== tagNames[type]) {
      if (formattedElement === editor) {
        return; // No formatted element found
      }
      formattedElement = formattedElement.parentNode;
    }
  }

  // Get the parent of the formatted element
  const parent = formattedElement.parentNode;

  // Create a document fragment to hold the contents
  const fragment = document.createDocumentFragment();

  // Move all child nodes to the fragment
  while (formattedElement.firstChild) {
    fragment.appendChild(formattedElement.firstChild);
  }

  // Replace the formatted element with its contents
  parent.replaceChild(fragment, formattedElement);

  // Create a new range selecting the inserted content
  const selection = window.getSelection();
  selection.removeAllRanges();

  if (fragment.firstChild && fragment.lastChild) {
    // Create range only if fragment has content
    const newRange = document.createRange();
    newRange.setStartBefore(fragment.firstChild);
    newRange.setEndAfter(fragment.lastChild);
    selection.addRange(newRange);
  } else {
    // If the fragment was empty, just set cursor at insertion point
    const emptyRange = document.createRange();

    // Find the position where the formatted element was
    const position = Array.from(parent.childNodes).indexOf(formattedElement);

    // If position is valid, set cursor there, otherwise set at the end of parent
    if (position >= 0) {
      emptyRange.setStart(parent, position);
    } else {
      // The element is already removed, so set cursor at the end of parent
      const lastPos = parent.childNodes.length;
      emptyRange.setStart(parent, lastPos);
    }

    emptyRange.collapse(true);
    selection.addRange(emptyRange);
  }
}

// Toggle spoiler content on click
editor.addEventListener('click', (e) => {
  if (e.target.classList.contains('spoiler')) {
    e.target.classList.toggle('revealed');
  }
});
// =============================================================================
