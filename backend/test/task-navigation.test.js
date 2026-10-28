const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const base = path.join(__dirname, '../admin/src/utils');
function moduleSource(file, modules) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(base, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(code, { exports, URL, require: name => { if (name in modules) return modules[name]; throw Error(name); } });
  return exports;
}
const taskId = moduleSource('taskId.ts', {});
const nav = moduleSource('taskNavigation.ts', { './taskId': taskId });
const A = 'aaaaaaaaaaaaaaaaaaaaaaaa', B = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const absolute = path => 'https://admin.kampungcetak.com' + path;

test('search link opens task A once; closing clears only task parameters and prevents late reopen', () => {
  const initial = `https://admin.kampungcetak.com/admin/tasks?taskId=${A}&view=board#list`;
  assert.equal(nav.shouldOpenLinkedTask(initial, A, { _id: A }, null), true);
  assert.equal(nav.shouldOpenLinkedTask(initial, A, { _id: A }, A), false, 'refetch must not reopen the same task');
  const closed = absolute(nav.taskUrlForSelection(initial));
  assert.equal(closed, 'https://admin.kampungcetak.com/admin/tasks?view=board#list');
  assert.equal(nav.shouldOpenLinkedTask(closed, A, { _id: A }, null), false, 'late A response must not reopen after close');
});

test('selecting B updates URL and a late A response cannot replace B', () => {
  const initial = `https://admin.kampungcetak.com/admin/tasks?taskId=${A}&view=list#top`;
  const selected = absolute(nav.taskUrlForSelection(initial, B));
  assert.equal(new URL(selected).searchParams.get('taskId'), B);
  assert.equal(new URL(selected).searchParams.get('view'), 'list');
  assert.equal(new URL(selected).hash, '#top');
  assert.equal(nav.shouldOpenLinkedTask(selected, A, { _id: A }, B), false, 'stale request must not override B');
  assert.equal(nav.shouldOpenLinkedTask(selected, B, { _id: A }, B), false, 'mismatched response must not open');
  assert.equal(nav.shouldOpenLinkedTask(selected, B, { _id: B }, B), false, 'already selected B must not be reopened on refresh');
});

test('fresh navigation opens the requested task, including legacy links and uppercase IDs', () => {
  const legacy = `https://admin.kampungcetak.com/admin/tasks?task=${A.toUpperCase()}&filter=mine`;
  assert.equal(nav.taskIdFromSearch(new URL(legacy).searchParams), A);
  assert.equal(nav.shouldOpenLinkedTask(legacy, A, { _id: A }, B), true);
  assert.equal(nav.taskUrlForSelection(legacy, B), `/admin/tasks?filter=mine&taskId=${B}`);
  assert.equal(nav.taskIdFromSearch(new URL('https://admin.kampungcetak.com/admin/tasks?taskId=undefined').searchParams), undefined);
});

test('task list, board, create, and modal close use the shared URL selection handlers', () => {
  const source = fs.readFileSync(path.join(base, '../components/global/tasks/tasksManager.tsx'), 'utf8');
  assert.match(source, /onTaskCreated=\{openTask\}/);
  assert.match(source, /onClose=\{closeTask\}/);
  assert.match(source, /onClick=\{\(\) => openTask\(task\)\}/);
  assert.match(source, /openTask\(task\);\s*lastClickedIdRef/);
  assert.match(source, /shouldOpenLinkedTask\(window\.location\.href, linkedTaskId, linkedTask, openedLinkedTaskId\.current\)/);
});
