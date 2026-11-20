"""Sample file for trying out the extension. Right-click inside any function."""


def add(a, b):
    """Passing doctests.

    >>> add(1, 2)
    3
    >>> add(-1, 1)
    0
    """
    return a + b


def subtract(a, b):
    """One passing and one deliberately FAILING doctest.

    >>> subtract(5, 3)
    2
    >>> subtract(1, 1)
    1
    """
    return a - b


def multiply(a, b):
    """This function has no doctests."""
    return a * b


class Counter:
    def __init__(self):
        self.count = 0

    def increment(self):
        """Methods work too (runs as Counter.increment).

        >>> c = Counter()
        >>> c.increment()
        1
        """
        self.count += 1
        return self.count


if __name__ == "__main__":
    # Proof that this block is NOT run by the extension.
    print("The __main__ block ran!")
