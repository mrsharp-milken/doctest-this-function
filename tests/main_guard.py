"""Standard __main__ guard (already works).

Expected: doctests for square() run and pass; "guard ran!" should NOT appear.
"""


def square(x):
    """
    >>> square(3)
    9
    """
    return x * x


def main():
    print("guard ran!")


if __name__ == "__main__":
    main()
