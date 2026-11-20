// Smoke test: loads extension.js against a FAKE `vscode` module, triggers each command, and
// runs the line it would type into the terminal using the real shell. Run via tests/run_tests.sh.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const file = path.join(__dirname, 'basics.py');
const lines = fs.readFileSync(file, 'utf8').split('\n');
const cursorLine = lines.findIndex((l) => l.startsWith('def subtract')) + 1; // inside subtract

const commands = {};
const sent = [];   // what was typed into the terminal
const errors = []; // error pop-ups shown
const fakeVscode = {
  commands: { registerCommand: (id, fn) => { commands[id] = fn; return { dispose() {} }; }, executeCommand() {} },
  window: {
    activeTextEditor: {
      document: {
        languageId: 'python', isUntitled: false, uri: { fsPath: file },
        lineAt: (i) => ({ text: lines[i] }), save: async () => true,
      },
      selection: { active: { line: cursorLine } },
    },
    createTerminal: () => ({ show() {}, sendText: (t) => sent.push(t), exitStatus: undefined }),
    onDidCloseTerminal: () => ({ dispose() {} }),
    showErrorMessage: async (m) => { errors.push(m); },
  },
  workspace: {
    getConfiguration: () => ({ inspect: () => ({ defaultValue: 'python3' }) }),
    getWorkspaceFolder: () => ({ uri: { fsPath: root } }),
  },
  env: { shell: process.env.SHELL || '/bin/sh' },
};
const realLoad = Module._load;
Module._load = (request, ...rest) => (request === 'vscode' ? fakeVscode : realLoad(request, ...rest));

const ext = require('../extension.js');
const context = { extensionPath: root, subscriptions: [] };
ext.activate(context);

function run(line) {
  const r = spawnSync(fakeVscode.env.shell, ['-c', line], { encoding: 'utf8', cwd: root });
  return { code: r.status, out: r.stdout + r.stderr };
}

(async () => {
  let failures = 0;
  const check = async (name, command, wantCode, mustInclude, mustExclude) => {
    sent.length = 0;
    await commands[command]();
    try {
      assert.strictEqual(sent.length, 1, 'expected one terminal command, errors: ' + errors.join('; '));
      const { code, out } = run(sent[0]);
      assert.strictEqual(code, wantCode, out);
      for (const t of mustInclude) assert.ok(out.includes(t), `missing "${t}" in:\n${out}`);
      for (const t of mustExclude) assert.ok(!out.includes(t), `unexpected "${t}" in:\n${out}`);
      console.log('PASS  ' + name);
    } catch (e) { failures++; console.log('FAIL  ' + name + '\n      ' + String(e.message).split('\n').join('\n      ')); }
  };

  // basics.py: add (passes), subtract (one fails), Counter.increment (passes)
  await check('function / show all', 'doctestThisFunction.function.all', 1, ['for subtract', 'PASSED', 'FAILED'], ['add(1, 2)']);
  await check('function / failures only', 'doctestThisFunction.function.failures', 1, ['for subtract', 'FAILED'], ['PASSED']);
  await check('function / first failure', 'doctestThisFunction.function.first', 1, ['Stopped at the first failure'], ['PASSED']);
  await check('original command id still works', 'doctestThisFunction.run', 1, ['for subtract'], []);
  await check('file / show all', 'doctestThisFunction.file.all', 1, ['the whole file', '--- add ---', '--- Counter.increment ---', 'FAILED'], []);
  await check('file / failures only', 'doctestThisFunction.file.failures', 1, ['the whole file', 'FAILED'], ['PASSED', '--- add']);
  await check('file / first failure', 'doctestThisFunction.file.first', 1, ['Stopped at the first failure'], ['--- ']);

  // The whole-file commands must not need the cursor to be inside a function.
  fakeVscode.window.activeTextEditor.selection.active.line = 0;
  await check('file command works with cursor outside any function', 'doctestThisFunction.file.failures', 1, ['the whole file'], []);
  sent.length = 0; errors.length = 0;
  await commands['doctestThisFunction.function.all']();
  try {
    assert.strictEqual(sent.length, 0);
    assert.ok(errors.some((e) => e.includes('Put your cursor inside a function')));
    console.log('PASS  function command still asks for the cursor to be in a function');
  } catch (e) { failures++; console.log('FAIL  cursor check\n      ' + e.message); }

  process.exit(failures ? 1 : 0);
})();
