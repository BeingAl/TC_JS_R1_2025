/* =============================================================================
CONSTS & CONFIGS
============================================================================= */
const chatInputID = 'chat-input';
const chatInput = document.getElementById(chatInputID);

const zeroWidthSpace = '\u200B'; // zero-width-space character.
const zeroWidthSpaceClass = 'non-editable'; // zero-width-space css class.

// #ref: ./script.js
const OS = detectOS();
const IS_MAC = OS === OS_MAC; // eslint-disable-line no-use-before-define
const IS_SAFARI = isSafari(); // eslint-disable-line no-use-before-define

const MAX_HISTORY = 100; // Maximum number of history states to keep
let historyStack = []; // History stack
/* =============================================================================
CHAT FUNCTIONALITY
============================================================================= */
/**
 * @returns null
 * @description Send message functionality and setup listeners
 */
function setupChatInput() {
  const sendBtnID = 'send-btn';
  const sendBtn = document.getElementById(sendBtnID);

  sendBtn.addEventListener('click', () => {
    const msg = chatInput.innerHTML;
    if (msg !== '') {
      // #ref: components/chat_box/script.js
      appendMessage('self', msg);
      chatInput.innerHTML = '';

      // For #Demo version =========================
      const ast = parseHTMLToAST(msg);
      const html = astToHTML(ast);
      const markdown = astToMarkdown(ast);

      console.log(ast);
      console.log(html);
      console.log(markdown);
      // For #Demo version =========================
    }
  });

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.shiftKey) {
      // Reserved: Used to go to a new line.
    } else if (e.key === 'Enter') {
      // It will create any plain text inside the div.
      // That's why we must prevent it and use (Shift+Enter).
      e.preventDefault();
    }

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

        if (lastState !== undefined) chatInput.innerHTML = lastState;
        else chatInput.innerHTML = '';
      }
    }
  });

  chatInput.addEventListener('input', () => {
    editorPprocessor(chatInputID);

    // Push state to the history stack
    const msg = chatInput.innerHTML;
    pushHistory(msg);
  });
}

// When the user's draft is restored after page load
document.addEventListener('DOMContentLoaded', () => {
  let msg = chatInput.innerHTML;
  if (msg !== '') {
    editorPprocessor(chatInputID);
    msg = chatInput.innerHTML;
  }
  pushHistory(msg);
});
/* =============================================================================
HTML -> Abstract Syntax Tree (AST)
Create a standard Object[] and use it to output a variety of formats:
HTML, Markdown, AsciiDoc, RTF, reST, etc.
============================================================================= */
/**
 * @param {string} htmlString The HTML source to be parsed.
 * @returns {Array|Object} The AST object/object[].
 * @description Converts an HTML string into an AST object/object[].
 */
function parseHTMLToAST(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  /**
   * @param {Object} node
   * @returns {(Object|null)}
   * @description Recursively traverse the DOM and construct the AST.
   */
  function traverse(node) {
    // Process element nodes.
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();
      const children = [];
      node.childNodes.forEach((child) => {
        const astChild = traverse(child);
        if (astChild !== null) {
          children.push(astChild);
        }
      });
      // Process element attributes.
      const attributes = {};
      Array.from(node.attributes).forEach((attr) => {
        attributes[attr.name] = attr.value;
      });
      return {
        type: 'element',
        tagName,
        attributes,
        children,
      };
    }
    // Process text nodes.
    else if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.textContent;
      if (textContent === '') return null;
      return {
        type: 'string',
        content: textContent,
      };
    }
    // Process comment nodes
    else if (node.nodeType === Node.COMMENT_NODE) {
      return {
        type: 'comment',
        content: node.textContent,
      };
    }
    return null;
  }

  // Build the AST from the body children.
  const ast = [];
  doc.body.childNodes.forEach((node) => {
    const astNode = traverse(node);
    if (astNode !== null) {
      ast.push(astNode);
    }
  });
  return ast;
}
/* =============================================================================
Abstract Syntax Tree (AST) -> HTML
============================================================================= */
/**
 * @param {Array|Object} ast The AST object/object[].
 * @returns {string} The reconstructed HTML string.
 * @description Converts an AST into an HTML string.
 */
function astToHTML(ast) {
  /**
   * @param {Object} node
   * @returns {string}
   * @description Convert a single AST node to HTML.
   */
  function nodeToHTML(node) {
    switch (node.type) {
      case 'element': {
        const { tagName, attributes, children } = node;
        let attrString = '';
        for (const key in attributes) {
          attrString += ` ${key}="${attributes[key]}"`;
        }
        // Handle void elements (<br>, <img>, etc.) without a closing tag.
        const voidElements = ['br', 'img', 'hr', 'input', 'meta', 'link'];
        if (voidElements.includes(tagName)) {
          return `<${tagName}${attrString}>`;
        }
        let html = `<${tagName}${attrString}>`;
        if (children && children.length) {
          html += children.map((child) => nodeToHTML(child)).join('');
        }
        html += `</${tagName}>`;
        return html;
      }
      case 'string':
        return node.content;
      case 'comment':
        return `<!--${node.content}-->`;
      default:
        return '';
    }
  }

  let html;
  if (Array.isArray(ast)) {
    html = ast.map(nodeToHTML).join('');
  } else {
    html = nodeToHTML(ast);
  }

  // Remove a single leading newline if it exists.
  if (html.startsWith('\n')) {
    html = html.substring(1);
  }
  return html;
}
/* =============================================================================
Abstract Syntax Tree (AST) -> MARKDOWN
============================================================================= */
/**
 * @param {Array|Object} ast The AST object/object[].
 * @returns {string} Markdown formatted string.
 * @description Converts an AST to a Markdown formatted string.
 */
function astToMarkdown(ast) {
  /**
   * @param {string} text
   * @returns {string}
   * @description This ensures that user-intended multiple spaces between
   * words are preserved, while unintended leading indentation on
   * new lines (due to HTML formatting) is removed.
   */
  function preserveSpaces(text) {
    // Replace tabs with 4 spaces.
    text = text.replace(/\t/g, '    ');
    // Split text by newline.
    const lines = text.split('\n');
    const processedLines = lines.map((line, index) => {
      // For lines after the first, remove all leading spaces.
      if (index > 0) {
        line = line.replace(/^ +/, '');
      }
      // Replace every occurrence of 2 or more spaces with
      // one regular space plus &nbsp; for each extra space.
      // Example: "     " (5 spaces) becomes " " + "&nbsp;&nbsp;&nbsp;&nbsp;".
      return line.replace(
        / {2,}/g,
        (match) => ' ' + '&nbsp;'.repeat(match.length - 1)
      );
    });
    return processedLines.join('\n');
  }

  /**
   * @param {Object} node
   * @returns {string}
   * @description Converts a single AST node to its Markdown representation.
   */
  function nodeToMarkdown(node) {
    if (!node) return '';

    if (node.type === 'string') {
      return preserveSpaces(node.content);
    }

    if (node.type === 'comment') {
      // Skip comments in Markdown output.
      return '';
    }

    if (node.type === 'element') {
      const tag = node.tagName.toLowerCase();
      const children = node.children
        ? node.children.map((child) => nodeToMarkdown(child)).join('')
        : '';

      switch (tag) {
        case 'span':
          if (node.attributes['class'] === zeroWidthSpaceClass) return '';
        case 's':
        case 'del':
        case 'strike':
          return '~~' + children + '~~';
        case 'u':
          // fallback to HTML (Markdown doesn't have native underline)
          return '<u>' + children + '</u>';
        case 'pre':
          return String('`' + children + '`') + '  \n';
        case 'code':
          return '`' + children + '`';
        case 'i':
        case 'em':
          return '*' + children + '*';
        case 'b':
        case 'strong':
          return '**' + children + '**';
        case 'mark':
          // fallback to HTML (Markdown doesn't have native highlight)
          return '<mark>' + children + '</mark>';
        case 'a': {
          const href =
            node.attributes && node.attributes.href ? node.attributes.href : '';
          let title = '';
          if (node.attributes && node.attributes.title) {
            title = ' "' + node.attributes.title + '"';
          }
          return '[' + children + '](' + href + title + ')';
        }
        case 'q':
          return children
            .split('\n')
            .map((line) => '> ' + line)
            .join('\n');
        case 'blockquote':
          // Prefix every line with '> '.
          return (
            String(
              children
                .split('\n')
                .map((line) => '> ' + line)
                .join('\n')
            ) + '  \n'
          );
        case 'details':
          // Spoiler is not supported natively in Markdown.
          // Instead, I use this combination: HTML <details> and <summary>
          const _children = children.replace(SPOILER_ALERT_MSG, '');
          return (
            '<details><summary>SPOILER</summary>\n' +
            _children +
            '\n</details>' +
            '  \n'
          );
        case 'br':
          return '  \n';
        default:
          return children;
      }
    }

    return '';
  }

  if (Array.isArray(ast)) {
    return ast.map((node) => nodeToMarkdown(node)).join('');
  } else {
    return nodeToMarkdown(ast);
  }
}
/* =============================================================================
EDITOR POST_PROCESSOR
============================================================================= */
/**
 * @param {string} elementId The ID of the element to process.
 * @returns null
 * @description Searches for HTML tags within the element specified by the ID.
 * For each tag (except <br>):
 *  - If the tag is empty (ignoring whitespace), it is removed.
 *  - Otherwise, if the element is not "plain text":
 *      then a zero-width-space(U+200B) is inserted before and after the tag,
 *      but only if such a space doesn't already exist.
 */
function editorPprocessor(elementId) {
  const container = document.getElementById(elementId);
  if (!container) {
    return;
  }

  /**
   * @returns {HTMLElement} A span element with contenteditable set to false.
   * @description Creates a non-editable span containing the zero-width-space.
   */
  function createNonEditableZWS() {
    const span = document.createElement('span');
    span.setAttribute('class', 'non-editable');
    span.contentEditable = 'false';
    span.textContent = zeroWidthSpace;
    return span;
  }

  // Select all descendant elements of the container.
  const elements = container.querySelectorAll('*');
  elements.forEach((el) => {
    // Skip <br>
    if (el.tagName.toLowerCase() === 'br') return;

    // Skip ZWS spans.
    if (
      el.tagName.toLowerCase() === 'span' &&
      el.textContent.trim() === zeroWidthSpace
    )
      return;

    // Skip plain text divs
    if (el.tagName.toLowerCase() === 'div') {
      if (el.attributes.length === 0) {
        if (el.querySelector('*') === null) {
          return;
        }
      }
    }

    // If the element is empty, remove it.
    if (el.innerHTML.trim() === '') {
      el.remove();
    } else {
      // Check previous sibling for zero-width-space.
      let prevOK = false;
      let prevSibling = el.previousSibling;
      if (prevSibling && prevSibling.nodeType === Node.ELEMENT_NODE) {
        if (prevSibling.textContent.trim() === zeroWidthSpace) {
          prevOK = true;
        }
      }
      if (!prevOK) {
        // It causes a bug in Firefox but is OK in other browsers.
        // However, it does not cause any particular problem.
        const zwsBefore = createNonEditableZWS();
        // el.insertAdjacentElement("beforebegin", zwsBefore);
      }

      // Check next sibling for zero-width-space.
      let nextOK = false;
      let nextSibling = el.nextSibling;
      if (nextSibling && nextSibling.nodeType === Node.ELEMENT_NODE) {
        if (nextSibling.textContent.trim() === zeroWidthSpace) {
          nextOK = true;
        }
      }
      if (!nextOK) {
        const zwsAfter = createNonEditableZWS();
        el.insertAdjacentElement('afterend', zwsAfter);
      }
    }
  });
}
/* =============================================================================
UNDO FUNCTIONALITY (HISTORY)
============================================================================= */
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
// =============================================================================
