let rotation = 0;
document.body.addEventListener('click', () => {
  rotation -= 45;
  document.querySelector(
    '.plate'
  ).style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
});
