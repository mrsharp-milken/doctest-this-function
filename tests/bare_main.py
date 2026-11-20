"""A bare main() at the bottom, no __main__ guard.

Expected: doctests for add() run and pass; "main ran!" should NOT appear.
"""


def add(a, b):
    """
    >>> add(1, 2)
    3
    """
    return a + b


def main():
    print("main ran!")
    print(add(2, 2))


main()
