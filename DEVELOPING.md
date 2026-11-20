# Developing Python Doctest: This Function

Plain JavaScript and Python. No build step, no dependencies.

## Files
- `package.json` – declares the commands, the right-click submenu, and one setting
- `extension.js` – finds the function at the cursor, saves the file, runs the helper in a terminal
- `shell.js` – quotes the command correctly for the terminal's shell (bash, zsh, PowerShell, cmd, fish)
- `run_doctest.py` – loads your file and runs the doctests of one function (or the whole file):
  `python3 run_doctest.py example.py [add] [--root DIR] [--show all|failures|first]`
- `example.py` – a file to try the extension on
- `tests/` – `sh tests/run_tests.sh` runs everything
- `build-vsix.sh` – packages the extension as a `.vsix` (no Node or `vsce` needed)

## Try it while developing
Open this folder in VS Code/VSCodium and press **F5**. A second "Extension Development Host" window opens with the extension loaded. Open `example.py` there and right-click inside `add`, `subtract`, `multiply`, or `Counter.increment`.

## Run the tests
```
sh tests/run_tests.sh
```
The JavaScript tests need `node`, or VS Code/VSCodium/Cursor installed in `/Applications` (their bundled Node is used).

## Release a new version
1. Bump `version` in `package.json`.
2. `sh tests/run_tests.sh`
3. `sh build-vsix.sh` → creates `doctest-this-function-<version>.vsix`.
4. Copy the `.vsix` into the `cs50-workspace` template repo's `.setup/` folder (remove the old one).
5. Update the version number in the install command in `README.md` and in the template repo's README.
6. Commit and push the template repo. Students re-run the install command to update (a higher version replaces the old one).

## Terminal compatibility
The command typed into the terminal is quoted for the shell VS Code is actually using (`vscode.env.shell`): bash/zsh/sh/dash/ksh/Git Bash, fish, PowerShell and cmd.exe. Unknown shells are treated like bash.
- **Tested for real:** sh, bash, zsh, dash, ksh on macOS, with awkward paths (spaces, quotes, `$`, backticks, `;`).
- **Not tested on a real shell:** PowerShell, cmd.exe, fish. `tests/shell_test.js` only checks that we produce the text their quoting rules call for.
