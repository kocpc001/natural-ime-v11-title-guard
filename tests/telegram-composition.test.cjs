const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'../extension/telegram-composition-guard.js'),'utf8');
function page(t, beforeEditor=false) {
  const dom=new JSDOM('<!doctype html><div id="host"></div><textarea>草稿</textarea>',{url:'https://web.telegram.org/k/',runScripts:'outside-only'});
  t.after(()=>dom.window.close());
  const w=dom.window;
  const editor=w.document.createElement('div');
  editor.className='input-message-input';
  editor.setAttribute('contenteditable','true');
  editor.tabIndex=0;
  if(!beforeEditor)w.document.querySelector('#host').append(editor);
  w.eval(source);
  return {w,editor};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function begin(w,editor) {
  editor.focus();
  editor.dispatchEvent(new w.CompositionEvent('compositionstart',{bubbles:true}));
  editor.textContent=' ';
  editor.dispatchEvent(new w.InputEvent('input',{bubbles:true,isComposing:true,inputType:'insertCompositionText',data:' '}));
}
test('keeps the IME placeholder through Telegram empty cleanup and allows a native-style insertText commit',t=>{
  const {w,editor}=page(t);
  editor.addEventListener('input',()=>{if(!editor.textContent.trim())editor.replaceChildren();});
  begin(w,editor);
  assert.equal(editor.textContent,' ');
  editor.textContent='輸入測試';
  editor.dispatchEvent(new w.InputEvent('input',{bubbles:true,isComposing:false,inputType:'insertText',data:'輸入測試'}));
  assert.equal(editor.textContent,'輸入測試');
  editor.textContent=' ';
  editor.replaceChildren();
  assert.equal(editor.textContent,'','insertText ends protection even without compositionend');
  assert.equal(w.document.querySelector('textarea').value,'草稿');
});
test('preserves ordinary clearing and replacements and normalizes canceled composition afterward',async t=>{
  const {w,editor}=page(t);
  begin(w,editor);
  editor.replaceChildren(w.document.createTextNode('替換內容'));
  assert.equal(editor.textContent,'替換內容');
  editor.replaceChildren();
  assert.equal(editor.textContent,'','nonblank content can still be cleared');
  begin(w,editor);
  editor.dispatchEvent(new w.CompositionEvent('compositionend',{bubbles:true,data:''}));
  await settle();
  assert.equal(editor.textContent,'','canceled composition does not leave a space');
  begin(w,editor);
  w.document.querySelector('textarea').focus();
  editor.replaceChildren();
  assert.equal(editor.textContent,'','focusout releases protection');
});
test('attaches to editors created after startup and restores detached editors',async t=>{
  const {w,editor}=page(t,true);
  w.document.querySelector('#host').append(editor);
  await settle();
  assert.equal(Object.hasOwn(editor,'replaceChildren'),true);
  begin(w,editor);
  editor.replaceChildren();
  assert.equal(editor.textContent,' ');
  editor.remove();
  await settle();
  assert.equal(Object.hasOwn(editor,'replaceChildren'),false);
  const replacement=editor.cloneNode(false);
  w.document.querySelector('#host').append(replacement);
  await settle();
  begin(w,replacement);
  replacement.replaceChildren();
  assert.equal(replacement.textContent,' ');
});
test('leaves Telegram fake editors unmodified',async t=>{
  const {w}=page(t);
  const fake=w.document.createElement('div');
  fake.className='input-message-input input-field-input-fake';
  fake.setAttribute('contenteditable','true');
  w.document.body.append(fake);
  await settle();
  assert.equal(Object.hasOwn(fake,'replaceChildren'),false);
});
