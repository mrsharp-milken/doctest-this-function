// Tests for shell.js.   Run:  sh tests/run_tests.sh   (it finds a Node runtime for you)
//
// - bash / zsh / sh / dash / ksh: REALLY executed with awkward paths (spaces, quotes, $, backticks).
// - PowerShell / cmd / fish: compared against the exact text we expect. Those shells can't be
//   run on a Mac, so these only check our reading of their quoting rules, not the real thing.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { shellFamily, buildCommand } = require('../shell.js');

let failures = 0;
function test(name, fn) {
  try { fn(); console.log('PASS  ' + name); }
  catch (e) { failures++; console.log('FAIL  ' + name + '\n      ' + String(e.message).split('\n').join('\n      ')); }
}

// --- shell detection ---
test('shellFamily recognises common shells', () => {
  const cases = [
    ['/bin/zsh', 'darwin', 'posix'], ['/bin/bash', 'linux', 'posix'], ['/usr/bin/fish', 'linux', 'fish'],
    ['C:\\Program Files\\PowerShell\\7\\pwsh.exe', 'win32', 'powershell'],
    ['C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', 'win32', 'powershell'],
    ['C:\\WINDOWS\\system32\\cmd.exe', 'win32', 'cmd'],
    ['C:\\Program Files\\Git\\bin\\bash.exe', 'win32', 'posix'],
    ['', 'win32', 'powershell'], [undefined, 'darwin', 'posix'], ['/opt/weird/shell', 'linux', 'posix'],
  ];
  for (const [shell, platform, want] of cases) assert.strictEqual(shellFamily(shell, platform), want, String(shell));
});

// --- exact text for shells we can't run here ---
test('PowerShell: call operator, single quotes, doubled quotes', () => {
  assert.strictEqual(
    buildCommand('pwsh.exe', 'win32', ['python', 'C:\\Users\\Jo Smith\\it\'s.py']),
    "& 'python' 'C:\\Users\\Jo Smith\\it''s.py'");
});
test('PowerShell: curly quotes are doubled too', () => {
  assert.strictEqual(buildCommand('pwsh', 'win32', ['a\u2019b']), "& 'a\u2019\u2019b'");
});
test('cmd: double quotes, trailing backslash doubled', () => {
  assert.strictEqual(buildCommand('cmd.exe', 'win32', ['python', 'C:\\My Dir\\x.py', 'C:\\']),
    '"python" "C:\\My Dir\\x.py" "C:\\\\"');
});
test('fish: backslashes and quotes escaped', () => {
  assert.strictEqual(buildCommand('/usr/bin/fish', 'linux', ['a\\b', "it's"]), "'a\\\\b' 'it\\'s'");
});

// --- real execution for POSIX shells ---
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shelltest-'));
const awkward = [
  'plain', 'has space', "it's", 'dollar $HOME', 'tick `echo hi`', 'double "q"', 'back\\slash',
  'semi; echo injected', 'amp & more', 'glob *', 'unicode é中', '-dash',
];
const script = path.join(dir, "dir with 'quote' & $x", 'show args.py');
fs.mkdirSync(path.dirname(script), { recursive: true });
fs.writeFileSync(script, 'import sys, json\nprint(json.dumps(sys.argv[1:]))\n');

for (const sh of ['/bin/sh', '/bin/bash', '/bin/zsh', '/bin/dash', '/bin/ksh']) {
  if (!fs.existsSync(sh)) continue;
  test(`${sh}: awkward arguments arrive unchanged`, () => {
    const cmd = buildCommand(sh, process.platform, ['python3', script, ...awkward]);
    const r = spawnSync(sh, ['-c', cmd], { encoding: 'utf8' });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.deepStrictEqual(JSON.parse(r.stdout), awkward);
  });
}

fs.rmSync(dir, { recursive: true, force: true });
process.exit(failures ? 1 : 0);
