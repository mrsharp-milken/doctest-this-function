// Builds the command line we type into the terminal, quoted correctly for whichever shell
// the terminal is running. No dependency on the `vscode` module, so it can be tested alone
// (see tests/shell_test.js).
//
// Why this exists: bash/zsh, PowerShell and cmd.exe all treat quotes differently. For example
// PowerShell reads `"python" "x.py"` as two strings, not a command, and needs `& 'python' 'x.py'`.

// Which family of shells is this? Takes a path like "/bin/zsh" or "C:\\...\\pwsh.exe".
function shellFamily(shellPath, platform) {
  const base = String(shellPath || '').split(/[\\/]/).pop().toLowerCase().replace(/\.exe$/, '');
  if (base === 'powershell' || base === 'pwsh') return 'powershell';
  if (base === 'cmd') return 'cmd';
  if (base === 'fish') return 'fish';
  if (base === '') return platform === 'win32' ? 'powershell' : 'posix'; // unknown: guess the platform default
  return 'posix'; // bash, zsh, sh, dash, ksh, Git Bash, ...and anything we don't recognise
}

const quoters = {
  // 'single quotes' take everything literally; a quote itself becomes '\'' (close, escaped quote, reopen).
  posix: (s) => `'${s.replace(/'/g, `'\\''`)}'`,

  // fish: like posix, but inside 'single quotes' fish also treats \\ and \' as escapes.
  fish: (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`,

  // PowerShell: 'single quotes' are literal; a quote is doubled. PowerShell also treats the
  // curly quotes ‘ ’ ‚ ‛ as single quotes, so those get doubled too.
  powershell: (s) => `'${s.replace(/['\u2018\u2019\u201A\u201B]/g, (q) => q + q)}'`,

  // cmd.exe: "double quotes"; backslashes right before the closing quote must be doubled
  // (otherwise `"C:\dir\"` swallows the closing quote).
  cmd: (s) => `"${s.replace(/(\\+)$/, '$1$1')}"`,
};

// args[0] is the program to run, the rest are its arguments.
function buildCommand(shellPath, platform, args) {
  const family = shellFamily(shellPath, platform);
  const quote = quoters[family];
  const line = args.map(quote).join(' ');
  // PowerShell needs the call operator `&` to run a quoted program name.
  return family === 'powershell' ? `& ${line}` : line;
}

module.exports = { shellFamily, buildCommand };
