(() => {
  'use strict';
  // Verified against the Traditional Chinese Gmail Gemini prompt.
  const selector = '[contenteditable="true"][role="combobox"][aria-label="向 Gemini 提問"]';
  document.addEventListener('input', event => {
    const field = event.target;
    if (!field?.matches?.(selector) || document.activeElement !== field ||
        event.isComposing !== true || event.inputType !== 'insertCompositionText' ||
        event.data !== ' ') return;
    // Leave the native edit intact; do not let the application treat the
    // IME's temporary space as an ordinary empty-field input notification.
    // Real characters, deletion and non-composition input propagate normally.
    event.stopImmediatePropagation();
  }, true);
})();
