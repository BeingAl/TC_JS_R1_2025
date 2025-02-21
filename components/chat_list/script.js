/* =============================================================================
CONSTS
============================================================================= */
const names = [
  'John',
  'Sarah',
  'Mike',
  'Emma',
  'David',
  'Olivia',
  'Chris',
  'Sophia',
];
const surnames = [
  'Doe',
  'Smith',
  'Brown',
  'Johnson',
  'Williams',
  'Jones',
  'Davis',
  'Miller',
];
/* =============================================================================
GENERATE CHATS
============================================================================= */
/**
 * @returns null
 * @description Generate chat list
 */
function generateChatList() {
  const chatListContainer = document.querySelector('.chat-list');
  // Clear existing list if any.
  chatListContainer.innerHTML = '';

  for (let i = 1; i <= 30; i++) {
    const chatItem = document.createElement('div');
    chatItem.classList.add('chat-item');

    // Generate unread count (0 indicates read).
    const unreadCount = Math.random() > 0.5 ? getRandomInt(1, 99) : 0;
    chatItem.setAttribute('data-unread', unreadCount);

    // Profile image using random initials.
    const profileDiv = document.createElement('div');
    profileDiv.classList.add('profile-image');
    const firstName = names[getRandomInt(0, names.length - 1)];
    const lastName = surnames[getRandomInt(0, surnames.length - 1)];
    profileDiv.innerText = firstName.charAt(0) + lastName.charAt(0);

    // Chat details: name and preview message.
    const detailsDiv = document.createElement('div');
    detailsDiv.classList.add('chat-details');
    const nameDiv = document.createElement('div');
    nameDiv.classList.add('name');
    nameDiv.innerText = `${firstName} ${lastName}`;
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.innerText =
      sampleMessages[getRandomInt(0, sampleMessages.length - 1)];

    detailsDiv.appendChild(nameDiv);
    detailsDiv.appendChild(messageDiv);
    chatItem.appendChild(profileDiv);
    chatItem.appendChild(detailsDiv);

    // Append unread badge if needed.
    if (unreadCount > 0) {
      const badge = document.createElement('span');
      badge.classList.add('chat-badge');
      badge.innerText = unreadCount;
      chatItem.appendChild(badge);
    }
    chatListContainer.appendChild(chatItem);
  }
}
/* =============================================================================
DRAGGABLE SEPARATOR
============================================================================= */
/**
 * @returns null
 * @description Setup draggable separator
 */
function setupResizableSeparator() {
  const separator = document.querySelector('.separator');
  const middleColumn = document.querySelector('.middle-column');
  const container = document.querySelector('.container');

  let isResizing = false;

  separator.addEventListener('mousedown', () => {
    isResizing = true;
    document.body.style.cursor = 'col-resize';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const containerRect = container.getBoundingClientRect();
    const minMiddleWidth = containerRect.width * 0.25;
    const maxMiddleWidth = containerRect.width * 0.35;
    const leftColumnWidth = document
      .querySelector('.left-column')
      .getBoundingClientRect().width;

    let newWidth = e.clientX - leftColumnWidth;
    newWidth = Math.min(Math.max(newWidth, minMiddleWidth), maxMiddleWidth);
    const newWidthPercent = (newWidth / containerRect.width) * 100;
    middleColumn.style.width = newWidthPercent + '%';
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = 'default';
    }
  });
}
// =============================================================================
