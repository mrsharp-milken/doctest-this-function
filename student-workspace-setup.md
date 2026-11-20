# Add "Doctest This Function" to Your Workspace

You already have VSCodium set up. This adds one new feature: **right-click a function and run only its doctests.** It takes about two minutes.

## 1. Install it

1. Open VSCodium with your `cs50-workspace` folder.
2. Open a terminal: **Terminal ▸ New Terminal**.
3. Paste both lines, then press Enter:

```bash
curl -fsSL -o /tmp/doctest-this-function.vsix https://github.com/mrsharp-milken/cs50-workspace/raw/main/.setup/doctest-this-function-1.0.0.vsix
```
```bash
codium --install-extension /tmp/doctest-this-function.vsix --profile mrsharp-student
```

You should see:

```
Extension 'doctest-this-function.vsix' was successfully installed.
```

> **`command not found: codium`?** Press Cmd+Shift+P, run **Shell Command: Install 'codium' command in PATH**, open a new terminal, and paste the lines again.

## 2. Restart VSCodium

Quit VSCodium completely (Cmd+Q) and open it again.

## 3. Try it

1. Open a `.py` file that has doctests.
2. Click inside a function.
3. Right-click ▸ **Doctest This Function**.

Results appear in a terminal at the bottom called **Doctests**.

For more options (failures only, stop at first failure, whole file), right-click ▸ **Doctest This…**

## Not working?

- **Don't see it in the right-click menu?** Make sure you are in a `.py` file, you restarted VSCodium, and the robot icon in the bottom left shows your `mrsharp-student` profile is active.
- **"Couldn't find Python"?** Click **Open Settings** in the message and set `doctestThisFunction.pythonPath` to `python`.
- **Anything else?** Screenshot the terminal and show Mr. Sharp.
