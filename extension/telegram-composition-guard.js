(() => {
  'use strict';
  const selector = '.input-message-input[contenteditable="true"]:not(.input-field-input-fake)';
  const installed = new Map();

  function attach(field) {
    if (installed.has(field)) return;
    const own = Object.getOwnPropertyDescriptor(field, 'replaceChildren');
    const original = field.replaceChildren;
    let composing = false;
    let stopped = false;
    const start = () => { composing = true; };
    const end = () => {
      composing = false;
      queueMicrotask(() => {
        if (!stopped && !composing && field.isConnected && field.textContent && !field.textContent.trim()) {
          Reflect.apply(original, field, []);
        }
      });
    };
    // V11 can commit via insertText without delivering compositionend.
    const input = event => { if (event.isComposing === false) composing = false; };
    const blur = () => { composing = false; };
    field.addEventListener('compositionstart', start, true);
    field.addEventListener('compositionend', end, true);
    field.addEventListener('input', input, true);
    field.addEventListener('focusout', blur, true);
    Object.defineProperty(field, 'replaceChildren', {
      configurable: true, writable: true,
      value: function (...nodes) {
        const text = field.textContent ?? '';
        if (this === field && composing && nodes.length === 0 && document.activeElement === field && text.length > 0 && !text.trim()) return;
        return Reflect.apply(original, this, nodes);
      }
    });
    installed.set(field, () => {
      stopped = true;
      field.removeEventListener('compositionstart', start, true);
      field.removeEventListener('compositionend', end, true);
      field.removeEventListener('input', input, true);
      field.removeEventListener('focusout', blur, true);
      if (own) Object.defineProperty(field, 'replaceChildren', own);
      else delete field.replaceChildren;
    });
  }

  function scan(root) {
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (root.matches?.(selector)) attach(root);
    root.querySelectorAll(selector).forEach(attach);
  }
  scan(document);
  new MutationObserver(mutations => {
    for (const [field, stop] of installed) {
      if (!field.isConnected) { stop(); installed.delete(field); }
    }
    for (const mutation of mutations) mutation.addedNodes.forEach(scan);
  }).observe(document, { childList: true, subtree: true });
})();
