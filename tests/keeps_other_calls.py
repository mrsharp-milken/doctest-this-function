"""Top-level code that must NOT be skipped.

Expected: doctests for roll() pass. random.seed(0) and the assignment must still
run (only bare calls to functions defined in this file are skipped).
Seed 0 gives random.randint(1, 6) == 4 as the first value.
"""
import random

random.seed(0)
LIMIT = 6


def roll():
    """
    >>> roll()
    4
    """
    return random.randint(1, LIMIT)


def main():
    print("main ran!")


main()
