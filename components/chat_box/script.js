/* =============================================================================
GENERATE CONVERSATION
============================================================================= */
/**
 * @returns null
 * @description Generate conversation
 */
function generateChatConversation() {
  const chatBox = document.querySelector('.chat-box');
  chatBox.innerHTML = '';

  const totalMessages = 100;
  for (let i = 1; i <= totalMessages; i++) {
    // Randomly alternate sender.
    const sender = Math.random() > 0.5 ? 'self' : 'other';
    const text =
      sampleMessages[getRandomInt(0, sampleMessages.length - 1)] +
      ' (Message ' +
      i +
      ')';
    appendMessage(sender, text, true);
  }
}
/* =============================================================================
APPEND MESSAGES
============================================================================= */
/**
 * @param {string} sender Sender's name.
 * @param {string} text Chat message.
 * @param {boolean} autoScroll Scroll to the end of the conversation.
 * @returns null
 * @description Append messages
 */
function appendMessage(sender, text, autoScroll = true) {
  const chatBox = document.querySelector('.chat-box');
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message-item', sender);
  messageDiv.innerHTML = text;
  chatBox.appendChild(messageDiv);
  if (autoScroll) {
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}
// =============================================================================
