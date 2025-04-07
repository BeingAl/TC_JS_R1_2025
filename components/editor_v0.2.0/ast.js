/* =============================================================================
HTML -> Abstract Syntax Tree (AST)
============================================================================= */
/**
 * @param {object} element - The editable element containing HTML content
 * @returns {Array|Object} - Array of AST nodes representing the elem's content
 * @description Converts HTML content to an AST representation
 */
function htmlToAST(element) {
  // Clone the element to avoid modifications to the original
  const clonedElement = element.cloneNode(true);

  // Process markdown-like patterns in text nodes
  processMarkdownPatterns(clonedElement);

  // Convert the DOM structure to AST
  return domToAST(clonedElement);
}

/**
 * @param {object} node - The DOM node to process
 * @description Process markdown patterns in text nodes and convert them to
 * HTML elements
 */
function processMarkdownPatterns(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent;

    // Check if the text contains any markdown patterns
    if (
      text.includes('**') ||
      text.includes('__') ||
      text.includes('~~') ||
      text.includes('`')
    ) {
      // Create a temporary div to hold the processed HTML
      const tempDiv = document.createElement('div');

      // Replace markdown patterns with HTML
      let processedText = text
        // Bold: **text**
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        // Italic: __text__
        .replace(/__(.*?)__/g, '<i>$1</i>')
        // Strikethrough: ~~text~~
        .replace(/~~(.*?)~~/g, '<s>$1</s>')
        // Code: `text`
        .replace(/`(.*?)`/g, '<code>$1</code>');

      tempDiv.innerHTML = processedText;

      // Replace the original text node with the processed nodes
      const parentNode = node.parentNode;
      const fragment = document.createDocumentFragment();

      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
      }

      parentNode.replaceChild(fragment, node);
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    // Process child nodes recursively
    const childNodes = Array.from(node.childNodes);
    childNodes.forEach((child) => processMarkdownPatterns(child));
  }
}

/**
 * @param {object} domNode - The DOM node to convert
 * @returns {Array|Object} - Array of AST nodes
 * @description Converts a DOM element and its children to an AST representation
 */
function domToAST(domNode) {
  const result = [];

  // Process all child nodes
  for (let i = 0; i < domNode.childNodes.length; i++) {
    const childNode = domNode.childNodes[i];

    if (childNode.nodeType === Node.TEXT_NODE) {
      // Text node
      if (childNode.textContent.trim() !== '') {
        result.push({
          type: 'string',
          content: childNode.textContent,
        });
      }
    } else if (childNode.nodeType === Node.ELEMENT_NODE) {
      // Element node
      const elementNode = {
        type: 'element',
        tagName: childNode.tagName,
        childs: domToAST(childNode),
      };

      // Process attributes if they exist
      if (childNode.attributes && childNode.attributes.length > 0) {
        elementNode.attributes = {};
        for (let j = 0; j < childNode.attributes.length; j++) {
          const attr = childNode.attributes[j];
          elementNode.attributes[attr.name] = attr.value;
        }
      }

      result.push(elementNode);
    }
  }

  return result;
}
/* =============================================================================
Abstract Syntax Tree (AST) -> HTML
============================================================================= */
/**
 * @param {Array|Object} ast - The AST array to convert
 * @returns {string} - HTML string representation of the AST
 * @description Converts an AST representation back to HTML
 */
function astToHTML(ast) {
  let html = '';

  ast.forEach((node) => {
    if (node.type === 'string') {
      html += node.content;
    } else if (node.type === 'element') {
      // Start tag with attributes
      html += `<${node.tagName}`;
      if (node.attributes) {
        Object.entries(node.attributes).forEach(([key, value]) => {
          html += ` ${key}="${value}"`;
        });
      }
      html += '>';

      // Process children if they exist
      if (node.childs && node.childs.length > 0) {
        html += astToHTML(node.childs);
      }

      // Close tag (unless it's a self-closing tag)
      if (!['br', 'hr', 'img', 'input'].includes(node.tagName.toLowerCase())) {
        html += `</${node.tagName}>`;
      }
    }
  });

  return html;
}
// =============================================================================
