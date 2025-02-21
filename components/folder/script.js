/* =============================================================================
GENERATE FOLDERS
============================================================================= */
/**
 * @returns null
 * @description Generate folders
 */
function generateFolders() {
  // Define the first folders exactly as provided.
  const initialFolders = [
    'All Chats',
    'Personal',
    'Channels',
    'Groups',
    'Bots',
    'Other',
  ];
  // Define additional common folders
  const additionalFolders = [
    'Family',
    'Friends',
    'Work',
    'Spam',
    'Favorites',
    'History',
    'Urgent',
    'Media',
    'Files',
    'Events',
  ];

  // Combine arrays to form the final folder list
  const folderLabels = initialFolders.concat(additionalFolders);

  // Array of CSS classes.
  const iconClasses = [
    'icon-chat',
    'icon-user',
    'icon-rss-squared',
    'icon-users',
    'icon-android',
    'icon-folder',
    'icon-home',
    'icon-handshake-o',
    'icon-money',
    'icon-attention',
    'icon-star',
    'icon-graduation-cap',
    'icon-ambulance',
    'icon-picture',
    'icon-doc-text-inv',
    'icon-calendar',
  ];

  const foldersContainer = document.querySelector('.folders');

  // Initialize index for sequential selection of icon classes.
  let iconClassIndex = 0;

  // Create a folder item for each label.
  folderLabels.forEach((label, index) => {
    const folItem = document.createElement('div');
    folItem.classList.add('folder-item');
    if (index === 0) folItem.classList.add('active'); // All Chats

    // Create the icon element for the folder.
    const icon = document.createElement('i');
    // Pick the next class in sequence from the iconClasses array.
    const iconClass = iconClasses[iconClassIndex % iconClasses.length];
    iconClassIndex++;
    icon.classList.add(iconClass);
    folItem.appendChild(icon);

    // Create the text label underneath the icon.
    const labelText = document.createElement('span');
    labelText.classList.add('folder-label');
    labelText.innerText = label;
    folItem.appendChild(labelText);

    // With a 50% chance, add a badge with a random number between 1 and 99.
    if (Math.random() > 0.5) {
      const badge = document.createElement('span');
      badge.classList.add('folder-badge');
      badge.innerText = getRandomInt(1, 99);
      folItem.appendChild(badge);
    }

    // Add click event to update active styling:
    // Set icon and label colors to blue on click and revert others to gray.
    folItem.addEventListener('click', function () {
      document.querySelectorAll('.folder-item').forEach((item) => {
        item.classList.remove('active');
      });
      this.classList.add('active');
    });

    // Double click event to toggle chat list filtering.
    folItem.addEventListener('dblclick', toggleChatFilter);

    foldersContainer.appendChild(folItem);
  });
}
/* =============================================================================
GENERAL VARIABLES / UTILITY_FUNCTIONS
============================================================================= */
let filterActive = false;
/**
 * @returns null
 * @description On double-click, only the chats with unread messages are shown
 */
function toggleChatFilter() {
  filterActive = !filterActive;
  const chatItems = document.querySelectorAll('.chat-item');

  chatItems.forEach((item) => {
    const unread = parseInt(item.getAttribute('data-unread'));
    if (filterActive) {
      // Only display chat items with unread messages.
      if (unread === 0) {
        item.style.display = 'none';
      }
    } else {
      // Restore display of all chat items.
      item.style.display = 'flex';
    }
  });
}
/* ========================================================================== */
