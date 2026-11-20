#!/bin/sh
# Runs run_doctest.py against each example in this folder and checks the outcome.
# Usage: sh tests/run_tests.sh      (from anywhere)
cd "$(dirname "$0")" || exit 1
RUNNER=../run_doctest.py
fail=0

# check <file> <function> <expected exit code> <text that must NOT appear in output>
check() {
    out=$(python3 "$RUNNER" "$1" "$2" </dev/null 2>&1)
    code=$?
    ok=1
    [ "$code" -eq "$3" ] || ok=0
    if [ -n "$4" ] && printf '%s' "$out" | grep -q "$4"; then ok=0; fi
    if [ $ok -eq 1 ]; then echo "PASS  $1"; else echo "FAIL  $1 (exit $code, wanted $3)"; printf '%s\n' "$out" | sed 's/^/      /'; fail=1; fi
}

check bare_main.py          add    0 "main ran!"
check bare_main_input.py    greet  0 "EOFError"
check bare_main_raises.py   double 0 "crashed while loading"
check main_guard.py         square 0 "guard ran!"
check keeps_other_calls.py  roll   0 "main ran!"
check call_mid_file.py      later  0 "early call ran!"
check basics.py             add               0 ""
check basics.py             subtract          1 ""
check basics.py             multiply          2 ""
check basics.py             Counter.increment 0 ""
check syntax_error.py       broken 2 ""

# Whole-file mode (no function name) and --show modes
checkargs() {  # checkargs <expected exit code> <text that MUST appear> <args to run_doctest.py...>
    want=$1; must=$2; shift 2
    out=$(python3 "$RUNNER" "$@" </dev/null 2>&1); code=$?
    if [ "$code" -eq "$want" ] && printf '%s' "$out" | grep -q -- "$must"; then echo "PASS  $*"
    else echo "FAIL  $* (exit $code, wanted $want, looking for '$must')"; printf '%s\n' "$out" | sed 's/^/      /'; fail=1; fi
}
checkargs 0 "the whole file"                  main_guard.py
checkargs 1 "1 of 4 failed"                   basics.py --show failures
checkargs 1 "Stopped at the first failure"    basics.py --show first
checkargs 1 "Stopped at the first failure"    basics.py subtract --show first
checkargs 2 "has no doctests"                 no_doctests.py

# JavaScript tests (shell quoting + extension wiring). Needs node, or VS Code/VSCodium/Cursor's built-in one.
NODE=""
if command -v node >/dev/null 2>&1; then NODE=node; fi
for app in "/Applications/Visual Studio Code.app/Contents/MacOS/Code" "/Applications/VSCodium.app/Contents/MacOS/Electron" "/Applications/Cursor.app/Contents/MacOS/Cursor"; do
    if [ -z "$NODE" ] && [ -x "$app" ]; then NODE="env ELECTRON_RUN_AS_NODE=1 \"$app\""; fi
done
if [ -n "$NODE" ]; then
    for t in shell_test.js extension_test.js; do
        eval "$NODE $t" || fail=1
    done
else
    echo "SKIP  JavaScript tests (no node found)"
fi

exit $fail
