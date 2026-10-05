const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

for (const relative of ['../admin/src/utils/duplicateUpload.ts', '../../frontend/src/utils/duplicateUpload.ts']) {
  test(`${relative}: cancel prevents upload retry, confirm requests numbering`, async () => {
    const dialogs = [];
    const document = {
      body: { append: dialog => dialogs.push(dialog) },
      querySelector: () => null,
      createElement: tag => ({ tag, style: {}, children: [], setAttribute() {}, append(...children) { this.children.push(...children); }, showModal() {}, close() {}, remove() {}, focus() {} }),
    };
    const exports = {};
    const source = fs.readFileSync(path.join(__dirname, relative), 'utf8');
    vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports, document });
    const calls = [];
    const send = async action => {
      calls.push(action);
      return action === 'rename' ? { success: true, assignedName: 'art-2.pdf', url: 'signed-upload-url' } : { code: 'DUPLICATE_FILE', originalName: 'art.pdf', suggestedName: 'art-2.pdf' };
    };
    const cancelled = exports.requestUploadUrl(send);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(dialogs[0].children[0].textContent, 'Duplicated file');
    dialogs[0].children[2].onclick();
    await assert.rejects(cancelled, /Upload cancelled/);
    assert.deepEqual(calls, [undefined]);
    const renamed = exports.requestUploadUrl(send);
    await new Promise(resolve => setImmediate(resolve));
    dialogs[1].children[3].onclick();
    assert.equal((await renamed).assignedName, 'art-2.pdf');
    assert.deepEqual(calls, [undefined, undefined, 'rename']);
  });
}
