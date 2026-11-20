# Python Doctest: This Function

Run the doctests for **just one function**, straight from a right-click.

```python
def add(a, b):
    """
    >>> add(2, 3)
    5
    """
    return a + b
```

Right-click anywhere inside `add` → **Doctest This Function**. The results show up in a terminal at the bottom called **Doctests**.

## Install (VSCodium, `mrsharp-student` profile)

Open a terminal in VSCodium (Terminal ▸ New Terminal) and paste this whole block:

```
curl -fsSL -o /tmp/doctest-this-function.vsix https://github.com/mrsharp-milken/cs50-workspace/raw/main/.setup/doctest-this-function-1.0.0.vsix
codium --install-extension /tmp/doctest-this-function.vsix --profile mrsharp-student
```

You should see `Extension 'doctest-this-function.vsix' was successfully installed.`
Then **quit and reopen VSCodium**.

> If you get `command not found: codium`: press Cmd+Shift+P, run **Shell Command: Install 'codium' command in PATH**, open a new terminal, and try again.

## Use it

1. Open a `.py` file that has doctests.
2. Click inside a function.
3. Right-click ▸ **Doctest This Function**.

Want more control? Right-click ▸ **Doctest This…** and pick from the menu:

| Menu item | What runs | What you see |
|---|---|---|
| This Function: Show All | the function your cursor is in | every example, passed or failed |
| This Function: Failures Only | same | only the failed examples |
| This Function: Stop at First Failure | same | the first failure, then it stops |
| Whole File: Show All | every doctest in the file | every example, grouped by function |
| Whole File: Failures Only | same | only the failed examples |
| Whole File: Stop at First Failure | same | the first failure, then it stops |

- The **This Function** items need your cursor inside a function. The **Whole File** items don't.
- Everything is also in the Command Palette (Cmd+Shift+P): type `Doctest`.
- Your file is saved automatically before the tests run.
- Code under `if __name__ == "__main__":` is **not** run.

## Something went wrong?

| You see | Do this |
|---|---|
| "Put your cursor inside a function…" | Click inside the function's body or its `def` line first |
| "Couldn't find Python at 'python3'" | Click **Open Settings** and set `doctestThisFunction.pythonPath` (for example `python`) |
| "has no doctests" | Add `>>> ` lines to the function's docstring, followed by the expected output |
| "Couldn't find a function named … at the top level" | Functions defined inside other functions can't be tested on their own |
| The menu item isn't there | It only shows up in `.py` files. If you are in a `.py` file, check you restarted VSCodium after installing |
| "has no doctests" for the whole file | No docstring in the file has any `>>> ` lines yet |

Still stuck? Screenshot the terminal and show Mr. Sharp.

## Limitations

- Functions nested inside other functions can't be targeted on their own.
- "Whole File" only runs doctests written in that file, not in files it imports.

## Settings

| Setting | Default | What it does |
|---|---|---|
| `doctestThisFunction.pythonPath` | `python3` (`python` on Windows) | The command used to run Python |

---

Want to change the extension itself? See [DEVELOPING.md](DEVELOPING.md).
