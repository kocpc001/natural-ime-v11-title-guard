const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const source = fs.readFileSync(path.join(__dirname, '../extension/title-guard.js'), 'utf8');
function page(t, title = '') {
  const dom = new JSDOM('<!doctype html><html><head><title></title></head><body><textarea>草稿</textarea><div contenteditable="true">保留文字</div></body></html>', {
    url: 'https://x.com/example/status/1', runScripts: 'outside-only'
  });
  t.after(() => dom.window.close());
  dom.window.document.title = title;
  return dom;
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test('preserves short and boundary-length titles without tagging them', async t => {
  const { window } = page(t, 'X');
  window.eval(source);
  assert.equal(window.document.title, 'X');
  for (const length of [0, 179, 180]) {
    window.document.title = '字'.repeat(length);
    await settle();
    assert.equal(window.document.title, '字'.repeat(length));
  }
  assert.equal(window.document.querySelector('title').hasAttribute('data-natural-v11-title-guard'), false);
});

test('shortens 181, 313 and 600-unit titles, preserving the prefix', async t => {
  const { window } = page(t, '長'.repeat(313));
  window.eval(source);
  for (const length of [181, 313, 600]) {
    window.document.title = '長'.repeat(length);
    await settle();
    assert.equal(window.document.title.length, 180);
    assert.equal(window.document.title, '長'.repeat(173) + '… | V11');
  }
  assert.equal(window.document.querySelector('title').getAttribute('data-natural-v11-title-guard'), 'active');
});

test('does not leave a dangling high surrogate at the truncation boundary', t => {
  const { window } = page(t, 'a'.repeat(172) + '😀' + '後'.repeat(200));
  window.eval(source);
  assert.equal(window.document.title, 'a'.repeat(172) + '… | V11');
  assert.equal(window.document.title.length, 179);
});

test('protects direct text-node edits and replacement title elements', async t => {
  const { window } = page(t, '原標題');
  window.eval(source);
  window.document.querySelector('title').firstChild.data = '文'.repeat(500);
  await settle();
  assert.ok(window.document.title.length <= 180);
  const replacement = window.document.createElement('title');
  replacement.textContent = '新'.repeat(400);
  window.document.querySelector('title').replaceWith(replacement);
  await settle();
  assert.ok(window.document.title.length <= 180);
});

test('starts before head exists and protects a subsequently added title', async t => {
  const { window } = page(t);
  window.document.head.remove();
  window.eval(source);
  const head = window.document.createElement('head');
  window.document.documentElement.prepend(head);
  await settle();
  const title = window.document.createElement('title');
  title.textContent = '早'.repeat(313);
  head.append(title);
  await settle();
  assert.ok(window.document.title.length <= 180);
});

test('checks synchronously without canceling events or changing editor state', t => {
  const { window } = page(t, 'X');
  window.eval(source);
  const textarea = window.document.querySelector('textarea');
  const editor = window.document.querySelector('[contenteditable]');
  textarea.value = '測試草稿 😀';
  textarea.focus();
  textarea.setSelectionRange(2, 4);
  for (const type of ['focusin', 'keydown', 'compositionstart']) {
    window.document.title = '長'.repeat(313);
    const event = type === 'compositionstart'
      ? new window.CompositionEvent(type, { data: '測試中文', bubbles: true, cancelable: true })
      : new window.Event(type, { bubbles: true, cancelable: true });
    assert.equal(textarea.dispatchEvent(event), true);
    assert.equal(event.defaultPrevented, false);
    assert.ok(window.document.title.length <= 180);
    assert.equal(textarea.value, '測試草稿 😀');
    assert.equal(textarea.selectionStart, 2);
    assert.equal(textarea.selectionEnd, 4);
    assert.equal(window.document.activeElement, textarea);
    assert.equal(editor.textContent, '保留文字');
    if (type === 'compositionstart') assert.equal(event.data, '測試中文');
  }
});

test('does not loop indefinitely after its own title change', async t => {
  const { window } = page(t, 'X');
  window.eval(source);
  let mutationCount = 0;
  const observer = new window.MutationObserver(records => { mutationCount += records.length; });
  observer.observe(window.document.head, { childList: true, subtree: true, characterData: true, attributes: true });
  t.after(() => observer.disconnect());
  window.document.title = '長'.repeat(313);
  await settle();
  const stableTitle = window.document.title;
  const stableCount = mutationCount;
  await settle();
  assert.equal(window.document.title, stableTitle);
  assert.equal(mutationCount, stableCount);
  assert.ok(mutationCount < 10);
});

test('manifest limits execution to named HTTPS sites and requests no extra APIs', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../extension/manifest.json'), 'utf8'));
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.version, pkg.version);
  assert.equal(manifest.permissions, undefined);
  assert.equal(manifest.host_permissions, undefined);
  assert.equal(manifest.background, undefined);
  assert.equal(manifest.content_scripts.length, 3);
  const script = manifest.content_scripts[0];
  assert.equal(script.run_at, 'document_start');
  assert.equal(script.all_frames, false);
  assert.deepEqual(script.js, ['title-guard.js']);
  for (const pattern of script.matches) {
    assert.match(pattern, /^https:\/\/(?:\*\.)?(?:x\.com|twitter\.com|threads\.com|threads\.net)\/\*$/);
  }
  const telegram = manifest.content_scripts[1];
  assert.deepEqual(telegram.matches, ['https://web.telegram.org/k/*']);
  assert.deepEqual(telegram.js, ['telegram-composition-guard.js']);
  assert.equal(telegram.world, 'MAIN');
  assert.equal(telegram.run_at, 'document_start');
  assert.equal(telegram.all_frames, false);
  const gmail = manifest.content_scripts[2];
  assert.deepEqual(gmail.matches, ['https://mail.google.com/*']);
  assert.deepEqual(gmail.js, ['gmail-composition-filter.js']);
  assert.equal(gmail.world, 'MAIN');
  assert.equal(gmail.run_at, 'document_start');
  assert.equal(gmail.all_frames, false);
});
