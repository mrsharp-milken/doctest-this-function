"""main() calls input() at import time.

Expected: doctests for greet() run and pass without waiting for typing
(today this blocks, or raises EOFError when stdin is closed).
"""


def greet(name):
    """
    >>> greet("Ada")
    'Hello, Ada!'
    """
    return f"Hello, {name}!"


def main():
    name = input("Your name? ")
    print(greet(name))


main()
