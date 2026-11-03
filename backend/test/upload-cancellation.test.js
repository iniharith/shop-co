const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
for (const scenario of ['abort', 'presign-abort', 'network', 'timeout', 'http', 'success']) {
  test(`upload ${scenario}: reservation lifecycle`, async () => {
    const calls = [], controller = new AbortController();
    const api = { post: async (url, body) => {
      calls.push({ url, body });
      if (scenario === 'presign-abort') controller.abort();
      return { data: { success: true, signedUrl: 'https://s3.test', reservationToken: 'exact-reservation', assignedName: 'art.pdf' } };
    } };
    class XHR {
      upload = {};
      open() {} setRequestHeader() {} abort() {}
      send() {
        if (scenario === 'abort') controller.abort();
        if (scenario === 'network') this.onerror();
        if (scenario === 'timeout') this.ontimeout();
        if (['http', 'success'].includes(scenario)) { this.status = scenario === 'http' ? 500 : 200; this.onload(); }
      }
    }
    const exports = {};
    const source = fs.readFileSync(require('node:path').join(__dirname, '../admin/src/utils/s3Upload.ts'), 'utf8');
    vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, {
      exports, XMLHttpRequest: XHR, console,
      require: name => name === './axios' ? { default: () => api } : name === './duplicateUpload' ? { requestUploadUrl: send => send() } : { requireTaskId: () => {} },
    });
    const result = exports.uploadToS3Directly('token', { name: 'art.pdf', size: 10, type: 'application/pdf' }, undefined, undefined, controller);
    if (scenario === 'success') { assert.equal((await result).name, 'art.pdf'); assert.equal(calls.length, 1); }
    else {
      await assert.rejects(result);
      assert.equal(calls.length, 2);
      assert.equal(calls[1].url, '/api/files/cancel-upload');
      assert.equal(calls[1].body.reservationToken, 'exact-reservation');
    }
  });
}
