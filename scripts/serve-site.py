#!/usr/bin/env python3
"""Serve the wing.cx repo locally the way Vercel will serve it.

Applies the `rewrites` from the site's vercel.json, so sub-routes of the game
(/ships/2048/settings and friends) resolve to their prerendered HTML instead of
404ing. Without that the game looks broken locally in a way it will not be in
production.

Usage:
    python3 scripts/serve-site.py [port]

Then open http://localhost:8096/ships/2048/
"""

from __future__ import annotations

import functools
import http.server
import json
import os
import sys

SITE_ROOT = os.path.expanduser("~/Projects/wing.cx")
DEFAULT_PORT = 8096


def load_rewrites(root: str) -> dict[str, str]:
    config = os.path.join(root, "vercel.json")
    try:
        with open(config) as handle:
            return {r["source"]: r["destination"] for r in json.load(handle).get("rewrites", [])}
    except (FileNotFoundError, json.JSONDecodeError):
        # A missing or half-written vercel.json must not take the server down.
        return {}


class RewriteHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path: str) -> str:
        # Re-read per request rather than caching at startup: adding a route to
        # vercel.json should take effect on the next reload, not require
        # remembering to restart this server.
        rewrites = load_rewrites(SITE_ROOT)
        clean = path.split("?", 1)[0].rstrip("/") or "/"

        # Exact rules win, in the order Vercel applies them.
        if clean in rewrites:
            path = rewrites[clean]
        else:
            # Then wildcards, so the catch-all that sends unknown paths to the
            # game's own not-found screen can actually be tested locally rather
            # than only discovered in production.
            for source, destination in rewrites.items():
                if not source.endswith("/:path*"):
                    continue
                prefix = source[: -len(":path*")]
                if clean.startswith(prefix) and self._is_missing(clean):
                    path = destination
                    break

        return super().translate_path(path)

    def _is_missing(self, clean: str) -> bool:
        """True when nothing on disk answers this path, as Vercel would find."""
        candidate = super().translate_path(clean)
        return not (os.path.isfile(candidate) or os.path.isfile(candidate + ".html"))

    def log_message(self, fmt: str, *args) -> None:
        # Quieter than the default: only surface failures.
        if args and str(args[1]).startswith(("4", "5")):
            super().log_message(fmt, *args)


def main() -> int:
    if not os.path.isdir(SITE_ROOT):
        print(f"error: site repo not found at {SITE_ROOT}")
        return 1

    port = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT

    handler = functools.partial(RewriteHandler, directory=SITE_ROOT)
    server = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)

    print(f"serving {SITE_ROOT} at http://localhost:{port}")
    print(f"  game:  http://localhost:{port}/ships/2048/")
    print(f"  ships: http://localhost:{port}/ships/")
    print("ctrl-c to stop")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
