"""Plain behaviours: passing, failing, no doctests, class methods."""


def add(a, b):
    """Passing. Expected exit 0.

    >>> add(1, 2)
    3
    """
    return a + b


def subtract(a, b):
    """One passing, one deliberately FAILING. Expected exit 1.

    >>> subtract(5, 3)
    2
    >>> subtract(1, 1)
    1
    """
    return a - b


def multiply(a, b):
    """No doctests. Expected exit 2."""
    return a * b


class Counter:
    def increment(self):
        """Expected exit 0 (runs as Counter.increment).

        >>> Counter().increment()
        1
        """
        return 1
