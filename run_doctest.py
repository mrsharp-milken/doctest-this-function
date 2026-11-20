"""Run the doctests of ONE function, or of a whole file.

Usage:  python3 run_doctest.py <file.py> [function_name | ClassName.method_name]
                               [--root DIR] [--show all|failures|first]

(no function name) = every doctest in the file
--root: the project folder. File paths in the output are shown relative to it.
--show: all      print every example, passed or failed (default)
        failures print failed examples only
        first    print the first failure only, then stop
Exit code: 0 = all passed, 1 = some failed, 2 = couldn't run (see message).
"""
import argparse
import ast
import doctest
import importlib.util
import os
import sys
import traceback

IS_TERMINAL = sys.stdout.isatty()  # False when piped (e.g. in tests)
# Colour only on a real terminal, and only if NO_COLOR isn't set.
USE_COLOR = IS_TERMINAL and "NO_COLOR" not in os.environ
CLEAR_SCREEN = "\033[2J\033[3J\033[H"  # erase screen + scrollback, cursor to top-left


def paint(code, text):
    """Wrap each line in an ANSI colour code (per line, so colours survive wrapping/scrolling)."""
    if not USE_COLOR:
        return text
    return "\n".join(f"\033[{code}m{line}\033[0m" if line else line for line in text.split("\n"))


def green(text):
    return paint(32, text)


def red(text):
    return paint(31, text)


class FriendlyRunner(doctest.DocTestRunner):
    """DocTestRunner that prints each example in green (passed) or red (failed).

    doctest prints "Trying/Expecting" BEFORE it knows the result, so we hold that text back
    and print it once we know which colour to use. Every example starts with a divider line
    containing PASSED/FAILED/ERROR and `path/to/file.py:20`, which VS Code terminals turn
    into a Cmd/Ctrl+click link.

    show_passes=False prints failures only.
    """

    def __init__(self, display_path, show_passes=True, **kwargs):
        super().__init__(**kwargs)
        self.display_path = display_path
        self.show_passes = show_passes
        self.start_text = ""

    def _capture(self, report, *args):
        """Run one of doctest's report_* methods and return what it would have printed."""
        chunks = []
        report(chunks.append, *args)
        return "".join(chunks)

    def report_start(self, out, test, example):
        self.start_text = self._capture(super().report_start, test, example)

    def _divider(self, label, test, example):
        """A line of asterisks ending with the label and location, e.g.
        ************************************************ PASSED  example.py:18
        """
        end = f" {label} {self.display_path}:{test.lineno + example.lineno + 1}"
        return "*" * max(len(self.DIVIDER) - len(end), 8) + end

    def report_success(self, out, test, example, got):
        if self.show_passes:
            out(green(self._divider("PASSED", test, example) + "\n" + self.start_text + "ok") + "\n")

    def report_failure(self, out, test, example, got):
        self._report_bad(out, "FAILED", test, example,
                         self._capture(super().report_failure, test, example, got))

    def report_unexpected_exception(self, out, test, example, exc_info):
        self._report_bad(out, "ERROR", test, example,
                         self._capture(super().report_unexpected_exception, test, example, exc_info))

    def _report_bad(self, out, label, test, example, text):
        # doctest starts its failure text with its own plain divider line; drop it, since we
        # print our own labelled divider for EVERY example (pass or fail).
        text = text.removeprefix(self.DIVIDER + "\n")
        out(red(self._divider(label, test, example) + "\n" + text))


def stop(message):
    """Print a friendly message and quit without running any tests."""
    print(message)
    sys.exit(2)


def skip_top_level_calls(tree):
    """Remove bare top-level calls to functions defined in this file (e.g. a lone `main()`).

    Returns the removed nodes. Other top-level code (imports, assignments, random.seed(0),
    calls to library functions) is kept, since doctests may depend on it.
    """
    defined = {n.name for n in tree.body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))}
    kept, skipped = [], []
    for node in tree.body:
        is_own_call = (isinstance(node, ast.Expr) and isinstance(node.value, ast.Call)
                       and isinstance(node.value.func, ast.Name) and node.value.func.id in defined)
        (skipped if is_own_call else kept).append(node)
    tree.body = kept
    return skipped


def load_module(path):
    """Import the student's file from its real path (so debugger breakpoints work later).

    The module is NOT named __main__, so `if __name__ == "__main__":` blocks don't run.
    Bare top-level calls like `main()` are skipped too (see skip_top_level_calls).
    """
    name = os.path.splitext(os.path.basename(path))[0]
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    try:
        with open(path, "rb") as f:
            tree = ast.parse(f.read(), filename=path)
        for node in skip_top_level_calls(tree):
            print(f"(Skipped the top-level call to {node.value.func.id}() on line {node.lineno}.)")
        exec(compile(tree, path, "exec"), module.__dict__)
    except SyntaxError as err:
        where = f"line {err.lineno}"
        if err.filename and os.path.abspath(err.filename) != path:
            where += f" of {os.path.basename(err.filename)}"
        print(f"Your file has a syntax error on {where}, so no tests could run:")
        if err.text:
            print("    " + err.text.rstrip())
            if err.offset:
                print("    " + " " * (err.offset - 1) + "^")
        stop(f"SyntaxError: {err.msg}")
    except SystemExit:
        stop("Your file called exit() while loading, so no tests could run.")
    except Exception as err:
        print("Your file crashed while loading (before any tests ran).")
        print("Python runs all the top-level code in a file when it loads it:\n")
        # Drop our own and importlib's frames so the traceback only shows the student's code.
        frames = [f for f in traceback.extract_tb(err.__traceback__)
                  if not f.filename.startswith("<frozen") and f.filename != __file__]
        print("Traceback (most recent call last):")
        print("".join(traceback.format_list(frames)), end="")
        stop("".join(traceback.format_exception_only(type(err), err)).rstrip())
    return module


def find_function(module, dotted_name, filename):
    obj = module
    for part in dotted_name.split("."):
        obj = getattr(obj, part, None)
        if obj is None:
            stop(f"Couldn't find a function named '{dotted_name}' at the top level of {filename}.\n"
                 "Nested functions (defs inside other functions) can't be tested on their own.")
    return obj


def main():
    parser = argparse.ArgumentParser(description="Run the doctests of one function, or a whole file.")
    parser.add_argument("file", help="the .py file")
    parser.add_argument("name", nargs="?", help="function name, or ClassName.method_name "
                        "(leave out to run every doctest in the file)")
    parser.add_argument("--root", help="project folder; paths in the output are relative to it")
    parser.add_argument("--show", choices=["all", "failures", "first"], default="all",
                        help="all: every example; failures: failed examples only; "
                             "first: stop at the first failure")
    args = parser.parse_args()

    path = os.path.abspath(args.file)
    root = os.path.abspath(args.root) if args.root else os.path.dirname(path)
    shown_path = os.path.relpath(path, root)  # e.g. "week1/example.py"
    dotted_name = args.name  # None = whole file

    if IS_TERMINAL:  # start each run with a clean screen
        print(CLEAR_SCREEN, end="")
    print(f"=== Doctests for {dotted_name or 'the whole file'} ({shown_path}) ===")
    if not os.path.isfile(path):
        stop(f"Couldn't find the file {path}. Was it moved or renamed?")

    os.chdir(os.path.dirname(path))
    sys.path.insert(0, os.path.dirname(path))

    module = load_module(path)

    if dotted_name:
        func = find_function(module, dotted_name, shown_path)
        # recurse=False => only this function's own docstring, nothing else in the file.
        tests = doctest.DocTestFinder(recurse=False).find(
            func, dotted_name, module=module, globs=vars(module))
    else:
        # Everything defined in this file (module docstring, functions, classes and their
        # methods). Things the file merely imports from elsewhere are left out by doctest.
        tests = doctest.DocTestFinder(recurse=True).find(
            module, module.__name__, module=module, globs=vars(module))
    tests = sorted((t for t in tests if t.examples), key=lambda t: t.lineno or 0)
    for t in tests:  # show "add", not "example.add"
        t.name = t.name.removeprefix(module.__name__ + ".")
    if not tests:
        if not dotted_name:
            stop(f"{shown_path} has no doctests. Add lines starting with `>>> ` inside a "
                 "function's docstring, followed by the expected output.")
        stop(f"'{dotted_name}' has no doctests. Add lines starting with `>>> ` inside its "
             "docstring, followed by the expected output. For example:\n\n"
             "    def add(a, b):\n"
             '        """\n'
             "        >>> add(1, 2)\n"
             "        3\n"
             '        """')

    flags = doctest.FAIL_FAST if args.show == "first" else 0  # FAIL_FAST: stop inside a docstring
    runner = FriendlyRunner(shown_path, show_passes=(args.show == "all"), verbose=True,
                            optionflags=flags)
    failed = attempted = 0
    for test in tests:
        test.filename = shown_path  # doctest prints this in its 'File "...", line N' header
        if not dotted_name and args.show == "all":
            print(f"--- {test.name} ---")  # which function the examples below belong to
        result = runner.run(test)
        failed += result.failed
        attempted += result.attempted
        if failed and args.show == "first":
            break  # ...and stop here, across docstrings

    print()
    if failed:
        if args.show == "first":
            print(red(f"Stopped at the first failure ({attempted - 1} passed before it)"))
        else:
            print(red(f"{failed} of {attempted} failed"))
        sys.exit(1)
    print(green(f"{attempted} passed"))


if __name__ == "__main__":
    main()
