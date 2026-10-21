# Node.js Tutorial: Hello World HTTP Server

Package name: `nodejs-tutorial-hello-world`

## Purpose

A minimal, dependency-free Node.js HTTP server that serves one endpoint and one deliberate `404`. `GET /hello` answers `200` with the body `Hello world`; every other method and path answers `404` with the body `Not Found`. The entire implementation is one readable file, `server.js`, written as a beginner tutorial: no framework, no third-party package and no build step. Reading that file top to bottom shows port configuration and validation, request logging, response writing, routing, binding-error handling and shutdown; running it shows each of them working.

## Prerequisites

- **Node.js `>=18.0.0`.** The manifest declares this floor in `engines.node`, but npm treats that field as advisory: on an older Node it prints an `EBADENGINE` warning and still runs the project rather than refusing. Install a current Node.js release to stay inside the range.
- **Verified runtime: Node.js `v22.23.3` with npm `11.21.0`.** The project was built and exercised on that version, so the commands and outputs below are the ones observed there.
- **Node.js 18 is past end of life.** Support for that line ended on 30 April 2025 and its last release was `18.20.8`, so a reader on Node.js 18 is inside the declared range but outside vendor support. Prefer a maintained LTS release.

## Installation

Nothing needs to be installed beyond Node.js itself. The project declares no `dependencies` and no `devDependencies`, so `npm install` is not needed, no packages are downloaded and no lockfile is produced or committed. Place the three files — `server.js`, `package.json` and `README.md` — in one directory and the project is ready to run.

Run every command in this document from that directory — the one that holds `server.js`.

## Running the server

```bash
node server.js
```

```bash
npm start
```

Both commands start the same file, `server.js`: `npm start` runs the `start` script declared in `package.json`, which is `node server.js`. The server runs in the foreground until you stop it, and prints one startup line once the socket is bound. With `PORT` unset that line is:

```text
Server listening on port 3000
```

## Testing the server

With the server running, ask the served route for its response:

```bash
curl http://localhost:3000/hello
```

## Expected output

The served route answers `200` with the body `Hello world`:

```console
$ curl -s -i http://localhost:3000/hello
HTTP/1.1 200 OK
Content-Type: text/plain
Date: Wed, 21 Oct 2026 08:32:15 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

Hello world
```

An unmatched path answers `404` with the body `Not Found`:

```console
$ curl -s -i http://localhost:3000/invalid
HTTP/1.1 404 Not Found
Content-Type: text/plain
Date: Wed, 21 Oct 2026 08:32:15 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

Not Found
```

The only header the application sets is `Content-Type: text/plain`. Node's `http` module adds `Date`, `Connection: keep-alive` and `Keep-Alive: timeout=5`, and frames these short bodies with `Transfer-Encoding: chunked` because the application supplies no `Content-Length`.

### Method not matched

The route key is the method **and** the path, so only `GET /hello` is served. The same path with another method falls to the catch-all:

```bash
curl -s -i -X POST http://localhost:3000/hello
```

```console
$ curl -s -i -X POST http://localhost:3000/hello
HTTP/1.1 404 Not Found
Content-Type: text/plain
Date: Wed, 21 Oct 2026 08:32:15 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

Not Found
```

That `404` is the shipped contract, deliberate as specified. A stricter reading of HTTP semantics would answer `405` with an `Allow` header when a known path is addressed with an unsupported method; this project answers `404` instead, and nothing about the response reveals the internal routing decision.

Path matching is exact and case-sensitive, while the query string and fragment are not part of it: `GET /hello?name=blitzy` is served, whereas `/HELLO`, `/hello/` and `//hello` all fall to the catch-all.

## Request logging

Every request writes exactly one line to stdout, before the routing decision is taken, so unmatched requests are logged too. The format is `[ISO-8601 timestamp] [HTTP method] [request path]`:

```text
[2026-10-21T08:32:15.836Z] [GET] [/hello]
```

The path is the request target exactly as received, query string included, so `GET /hello?name=blitzy` is logged as `[/hello?name=blitzy]`.

## Stopping the server

Press CTRL+C in the terminal running the server. That sends `SIGINT`, and the server logs its shutdown, closes the socket with exit status `0`, and returns you to the prompt with the port released for the next run:

```text
Received SIGINT. Shutting down gracefully...
Server closed. Exiting.
```

Only `SIGINT` is handled; the server keeps serving until it arrives.

## Port configuration

`PORT` is the only configuration input. It defaults to `3000`, and valid values are integers in the range `1024-65535`. Start the server on another port by setting it for the process:

```bash
PORT=8080 node server.js
```

The startup line then reads:

```text
Server listening on port 8080
```

and `curl http://localhost:8080/hello` returns `200` with the body `Hello world`.

Any other value — non-numeric, a decimal such as `3000.5`, empty, or outside the range — is rejected before the socket is bound, with an actionable message on stderr and exit status `1`:

```text
Configuration error: PORT="abc" is not a valid port number. Use an integer between 1024 and 65535.
```

```text
Configuration error: PORT=80 is out of range. Use an integer between 1024 and 65535.
```

Ports below `1024` are refused by the program's own check rather than by an operating-system permission error: the accepted range starts at `1024` because lower ports are privileged, and the server never binds one. If the port is already held by another process, the server reports that and exits with status `1`:

```text
Error: port 3000 is already in use. Stop the process using it or start with a different port, e.g. PORT=3001 node server.js.
```
