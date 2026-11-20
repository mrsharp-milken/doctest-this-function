"""A bare call in the MIDDLE of the file, with a def after it.

Expected: doctests for later() run and pass; "early call ran!" should NOT appear.
"""


def setup():
    print("early call ran!")


setup()


def later():
    """
    >>> later()
    'ok'
    """
    return "ok"
