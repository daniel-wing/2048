#!/usr/bin/env python3
"""Serve this repo's built output the way Vercel will serve it.

Applies the `rewrites` from our own vercel.json, so sub-routes of the game
(/ships/2048/settings and friends) resolve to their prerendered HTML instead of
404ing. Without that the game looks broken locally in a way it will not be in
production.

Serves `build/`, which `npm run build` produces. It used to serve a checkout of
the wing.cx site instead, back when the export was committed there; this repo
now deploys itself and depends on nothing outside it.

Usage:
    npm run build
    python3 scripts/serve-local.py [port]

Then open http://localhost:8096/ships/2048/
"""

from __future__ import annotations

import functools
import http.server
import json
import os
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD_ROOT = os.path.join(REPO_ROOT, "build")
DEFAULT_PORT = 8096


def load_rewrites() -> dict[str, str]:
    config = os.path.join(REPO_ROOT, "vercel.json")
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
        rewrites = load_rewrites()
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
    if not os.path.isdir(BUILD_ROOT):
        print(f"error: no build at {BUILD_ROOT} — run `npm run build` first")
        return 1

    port = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT

    handler = functools.partial(RewriteHandler, directory=BUILD_ROOT)
    server = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)

    print(f"serving {BUILD_ROOT} at http://localhost:{port}")
    print(f"  game:  http://localhost:{port}/ships/2048/")
    print("ctrl-c to stop")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
