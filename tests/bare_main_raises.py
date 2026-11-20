"""main() raises an exception when called.

Expected: doctests for double() run and pass; no "crashed while loading" message.
"""


def double(x):
    """
    >>> double(4)
    8
    """
    return x * 2


def main():
    raise RuntimeError("main() blew up")


main()
