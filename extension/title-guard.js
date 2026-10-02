(() => {
  'use strict';
  const MAX_TITLE_UNITS = 180;
  const GUARD_ATTRIBUTE = 'data-natural-v11-title-guard';
  const SUFFIX = '… | V11';
  let headObserver;
  let bootstrapObserver;

  function protectTitle() {
    const titleNode = document.querySelector('head > title');
    if (!titleNode) return;
    const title = document.title;
    if (title.length <= MAX_TITLE_UNITS) return;
    let shortTitle = title.slice(0, MAX_TITLE_UNITS - SUFFIX.length);
    // Windows counts UTF-16 units; avoid cutting an emoji in half.
    const last = shortTitle.charCodeAt(shortTitle.length - 1);
    if (last >= 0xD800 && last <= 0xDBFF) shortTitle = shortTitle.slice(0, -1);
    document.title = shortTitle + SUFFIX;
    titleNode.setAttribute(GUARD_ATTRIBUTE, 'active');
  }

  function attachToHead() {
    if (!document.head) return false;
    headObserver = new MutationObserver(protectTitle);
    headObserver.observe(document.head, { childList: true, subtree: true, characterData: true });
    protectTitle();
    return true;
  }

  if (!attachToHead()) {
    bootstrapObserver = new MutationObserver(() => {
      if (attachToHead()) bootstrapObserver.disconnect();
    });
    bootstrapObserver.observe(document, { childList: true, subtree: true });
  }
  // Check synchronously before entering a field or starting a keystroke.
  // These listeners neither inspect nor alter the user's text or input events.
  document.addEventListener('focusin', protectTitle, true);
  document.addEventListener('keydown', protectTitle, true);
  document.addEventListener('compositionstart', protectTitle, true);
})();
