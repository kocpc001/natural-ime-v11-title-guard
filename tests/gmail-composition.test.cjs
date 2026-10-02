const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const source = fs.readFileSync(path.join(__dirname,'../extension/gmail-composition-filter.js'),'utf8');
function page(t) {
  const dom = new JSDOM('<!doctype html><div id="gemini" contenteditable="true" role="combobox" aria-label="向 Gemini 提問" tabindex="0"></div><div id="mail" contenteditable="true" tabindex="0"></div>',{url:'https://mail.google.com/',runScripts:'outside-only'});
  t.after(()=>dom.window.close());
  const w=dom.window, field=w.document.querySelector('#gemini');
  w.eval(source);
  return {w,field};
}
function input(w,field,text,opts={}) {
  field.textContent=text;
  field.dispatchEvent(new w.InputEvent('input',{bubbles:true,data:text,inputType:'insertCompositionText',isComposing:true,...opts}));
}
test('retains the native placeholder, delivers real text and lets the application clear normally',t=>{
  const {w,field}=page(t); const delivered=[];
  field.addEventListener('input',e=>{
    delivered.push(e.data);
    if(!field.textContent.trim())while(field.firstChild)field.removeChild(field.firstChild);
  });
  field.focus();
  input(w,field,' ');
  assert.equal(field.textContent,' ');
  assert.deepEqual(delivered,[]);
  input(w,field,'輸入測試');
  assert.equal(field.textContent,'輸入測試');
  input(w,field,'',{inputType:'deleteContentBackward',isComposing:false});
  assert.equal(field.textContent,'');
  assert.deepEqual(delivered,['輸入測試','']);
  assert.equal(Object.hasOwn(field,'removeChild'),false);
});
test('does not filter English, intentional spaces, other editors or unfocused input',t=>{
  const {w,field}=page(t); const seen=[];
  w.document.addEventListener('input',e=>seen.push(e.data));
  field.focus();
  input(w,field,'a',{inputType:'insertText',isComposing:false});
  input(w,field,' ',{inputType:'insertText',isComposing:false});
  input(w,field,'　');
  const mail=w.document.querySelector('#mail');mail.focus();
  input(w,mail,' ');
  input(w,field,' ');
  assert.deepEqual(seen,['a',' ','　',' ',' ']);
});
test('handles a Gemini prompt replaced after page load',t=>{
  const {w,field}=page(t); const replacement=field.cloneNode(false);
  field.replaceWith(replacement);replacement.focus();
  let delivered=0;replacement.addEventListener('input',()=>delivered++);
  input(w,replacement,' ');
  assert.equal(delivered,0);
  input(w,replacement,'輸');
  assert.equal(delivered,1);
});
