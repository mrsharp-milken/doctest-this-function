// Right-click in a Python file -> Doctest -> run one function's doctests, or the whole file's,
// showing everything, failures only, or stopping at the first failure.
// Plain JavaScript, no build step, no dependencies.
const vscode = require('vscode');
const path = require('path');
const { execFile } = require('child_process');
const { buildCommand } = require('./shell');

let terminal; // one reusable terminal called "Doctests"

// Scan upward from `line` to the nearest `def`. If it's indented (a method),
// keep going up to find its `class` and return "Class.method".
function findFunctionAtCursor(document, line) {
  for (let i = line; i >= 0; i--) {
    const def = /^(\s*)(?:async\s+)?def\s+(\w+)/.exec(document.lineAt(i).text);
    if (!def) continue;

    let name = def[2];
    if (def[1].length > 0) {
      for (let j = i - 1; j >= 0; j--) {
        const cls = /^(\s*)class\s+(\w+)/.exec(document.lineAt(j).text);
        if (cls && cls[1].length < def[1].length) {
          name = cls[2] + '.' + name;
          break;
        }
      }
    }
    return { name, defLine: i };
  }
  return null;
}

function getPythonPath() {
  const setting = vscode.workspace.getConfiguration('doctestThisFunction').inspect('pythonPath');
  const chosen = setting.workspaceFolderValue ?? setting.workspaceValue ?? setting.globalValue;
  if (chosen) return chosen;
  // Not set by the user: Windows normally has `python`, not `python3`.
  return process.platform === 'win32' ? 'python' : setting.defaultValue;
}

function pythonExists(pythonPath) {
  return new Promise((resolve) => execFile(pythonPath, ['--version'], (err) => resolve(!err)));
}

// Checks shared by every command. `scope` is 'function' or 'file'. Shows a message and
// returns undefined if something is wrong; otherwise returns what runInTerminal needs
// (`name` is undefined for the whole file).
async function prepare(editor, scope) {
  if (!editor || editor.document.languageId !== 'python') {
    vscode.window.showErrorMessage('Doctests can only be run from a Python (.py) file.');
    return undefined;
  }
  const document = editor.document;
  if (document.isUntitled) {
    vscode.window.showErrorMessage('Save this file with a .py name first, then try again.');
    return undefined;
  }

  let found;
  if (scope === 'function') {
    found = findFunctionAtCursor(document, editor.selection.active.line);
    if (!found) {
      vscode.window.showErrorMessage(
        'Put your cursor inside a function (on or below its `def` line), then right-click again.');
      return undefined;
    }
  }

  // The helper reads the file from disk, so make sure the latest edits are saved.
  if (!(await document.save())) {
    vscode.window.showErrorMessage(
      "Couldn't save the file, so the doctests would run on an old version.");
    return undefined;
  }

  const pythonPath = getPythonPath();
  if (!(await pythonExists(pythonPath))) {
    const choice = await vscode.window.showErrorMessage(
      `Couldn't find Python at '${pythonPath}'.`, 'Open Settings');
    if (choice === 'Open Settings') {
      vscode.commands.executeCommand('workbench.action.openSettings', 'doctestThisFunction.pythonPath');
    }
    return undefined;
  }

  // Paths in the output are shown relative to the project folder (falls back to the file's folder).
  const folder = vscode.workspace.getWorkspaceFolder(document.uri);
  const root = folder ? folder.uri.fsPath : path.dirname(document.uri.fsPath);

  return { file: document.uri.fsPath, name: found && found.name, pythonPath, root };
}

// show: 'all' | 'failures' | 'first' (see run_doctest.py --show)
function runInTerminal(context, { file, name, pythonPath, root }, show) {
  if (!terminal || terminal.exitStatus !== undefined) {
    // Start at the project root so the relative paths in the output are clickable.
    terminal = vscode.window.createTerminal({ name: 'Doctests', cwd: root });
  }
  terminal.show();
  // (run_doctest.py clears the screen itself before printing.)
  const helper = path.join(context.extensionPath, 'run_doctest.py');
  // Quote for the shell this terminal is actually running (bash, zsh, PowerShell, cmd, ...).
  const args = [pythonPath, helper, file];
  if (name) args.push(name);
  args.push('--root', root, '--show', show);
  terminal.sendText(buildCommand(vscode.env.shell, process.platform, args));
}

function activate(context) {
  const register = (command, scope, show) =>
    vscode.commands.registerCommand(command, async () => {
      const target = await prepare(vscode.window.activeTextEditor, scope);
      if (target) runInTerminal(context, target, show);
    });

  context.subscriptions.push(
    register('doctestThisFunction.run', 'function', 'all'), // original command id, kept so keybindings still work
    register('doctestThisFunction.function.all', 'function', 'all'),
    register('doctestThisFunction.function.failures', 'function', 'failures'),
    register('doctestThisFunction.function.first', 'function', 'first'),
    register('doctestThisFunction.file.all', 'file', 'all'),
    register('doctestThisFunction.file.failures', 'file', 'failures'),
    register('doctestThisFunction.file.first', 'file', 'first'),
    vscode.window.onDidCloseTerminal((t) => { if (t === terminal) terminal = undefined; })
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
