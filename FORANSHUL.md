# scrrblIX — Everything You Need to Know
### A story of real-time multiplayer drawing, binary protocols, and the bugs that humbled us

---

## What is this project?

scrrblIX is a real-time multiplayer drawing-and-guessing game — think Skribbl.io, but built entirely by you. Players join a room, take turns drawing a secret word on a shared canvas while everyone else frantically types guesses into a chat. Guess correctly and you score points. Draw well and you score too. Most points after all rounds wins.

It sounds simple. It is *not* simple to build. This document is your field guide to understanding every decision made, every bug that broke things, and every lesson worth carrying forward.

---

## The Big Picture: How It Actually Works

Imagine a pub quiz, except instead of shouting answers, someone is drawing on a whiteboard at the front of the room and everyone is yelling guesses. The "whiteboard" needs to update on everyone's screens **simultaneously**. That word — *simultaneously* — is the entire reason this project is architecturally interesting.

Traditional web apps work like a waiter: you ask, they bring. HTTP is request/response — you send a request, you get a response. But in a game like this, the server needs to *push* data to every player the moment a draw stroke happens, without anyone asking. That's what **WebSockets** are for. A WebSocket is a persistent, two-way pipe between the browser and the server. Once opened, it stays open. Either side can send data at any time.

The entire architecture flows from that one insight: **everything is a WebSocket event**.

---

## Technology Choices — and Why

### Backend: Go

Go was chosen for a very specific reason: **goroutines**. In a multiplayer game, you need to handle many clients simultaneously — each player connected, sending and receiving, with a timer counting down in the background. In most languages, doing things "at the same time" requires complex threading code. Go has goroutines: lightweight coroutines that are cheap to spawn and make concurrent code feel almost natural.

Go is also compiled, fast, and has a very clean standard library. For a WebSocket server that needs to relay binary drawing data with minimal latency, it's a great fit.

### Frontend: Next.js + React

Next.js is the React framework with server-side rendering, file-based routing, and Vercel deployment baked in. For this project, most of the interesting work happens on the client side (canvas drawing, WebSocket messages, game state), so Next.js is mostly used as a React app with some nice deployment conveniences.

### State Management: Zustand

Instead of React's built-in `useState` scattered everywhere, global game state (players, phase, timer, word hint, etc.) lives in a **Zustand store**. Zustand is like a tiny Redux without the ceremony. Any component can read or write to it directly. This matters enormously for a real-time game where 10 different events can arrive over WebSocket and need to update UI across 5 different components instantly.

The key insight: `useGameStore.getState()` lets you read/write the store from *outside* of React components — including inside WebSocket message handlers — without stale closures or re-render loops.

### Styling: Tailwind CSS

Utility-first CSS. Every visual element is described by atomic class names directly in the JSX. The design follows a **pop-art / comic book aesthetic**: thick black borders, hard drop shadows (no blur — just offset), and a pastel color palette. This was a deliberate creative choice that makes the app feel playful and distinctive.

### Drawing Protocol: Custom Binary

This is the most interesting technical decision. When someone draws a stroke on the canvas, that data needs to reach every other player as fast as possible. You *could* send JSON like:

```json
{"tool": "brush", "color": "#ff0000", "brushSize": 5, "x1": 120, "y1": 340, "x2": 125, "y2": 342}
```

But that's ~80 bytes for one tiny stroke. And strokes happen dozens of times per second. Instead, we use a **custom 12-byte binary packet**:

```
Byte 0:    message type (always 0x01 for draw)
Byte 1:    tool (0=brush, 1=eraser)
Byte 2:    color index (0-11, into a fixed color palette)
Byte 3:    brush size
Bytes 4-5: x1 (uint16 big-endian)
Bytes 6-7: y1 (uint16 big-endian)
Bytes 8-9: x2 (uint16 big-endian)
Bytes 10-11: y2 (uint16 big-endian)
```

12 bytes vs ~80 bytes. That's 6.5x smaller per packet. At 30 draw events per second during a fast sketch, that's the difference between 2.4KB/s and 16KB/s per player. Multiply across all players and it matters. Binary packets also parse faster — no JSON string parsing, just DataView byte reads.

---

## The Codebase Map — Where Everything Lives

```
scrrblIX/
├── backend/
│   ├── cmd/server/main.go              ← Entry point. Reads PORT, starts server.
│   ├── internal/
│   │   ├── server/router.go            ← HTTP routes, WebSocket upgrader, CORS
│   │   ├── websocket/
│   │   │   ├── hub.go                  ← The WebSocket hub: routes messages to rooms
│   │   │   ├── client.go               ← One Client per connected browser tab
│   │   │   └── message.go              ← All message/data struct types
│   │   ├── room/
│   │   │   ├── room.go                 ← The Room: players, broadcast, scoring
│   │   │   ├── manager.go              ← THE BRAIN: all game logic lives here
│   │   │   └── game_state.go           ← Timer, round tracking, guessed players
│   │   ├── game/
│   │   │   ├── words.go                ← Word list loader
│   │   │   └── scoring.go              ← Points calculation
│   │   └── models/player.go            ← Player struct
│   └── docker/Dockerfile               ← Multi-stage Docker build
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                    ← Home page (Create/Join room buttons)
│   │   ├── globals.css                 ← Global styles, pastel classes, scrollbars
│   │   └── room/
│   │       ├── create/page.tsx         ← Sends create_room over WebSocket
│   │       ├── join/page.tsx           ← Sends join_room over WebSocket
│   │       └── [roomId]/page.tsx       ← Lobby/Game container
│   ├── components/
│   │   ├── providers/
│   │   │   └── WebSocketProvider.tsx   ← THE HEART: WS connection, all message handling
│   │   └── game/
│   │       ├── Game.tsx                ← Main game layout: header, canvas, sidebars
│   │       ├── Canvas.tsx              ← Drawing canvas + toolbar
│   │       ├── Chat.tsx                ← Chat/guess input and message list
│   │       ├── PlayerList.tsx          ← Left sidebar: avatars, scores
│   │       ├── WordSelection.tsx       ← Overlay for drawer to pick a word
│   │       ├── RoundEnd.tsx            ← Round summary overlay
│   │       └── GameOver.tsx            ← Final scoreboard
│   ├── stores/gameStore.ts             ← Zustand store: all shared game state
│   ├── lib/constants.ts                ← WS_URL, event names, colors, brush sizes
│   └── hooks/useWebSocket.ts           ← (Legacy hook, superseded by Provider)
```

### The Most Important Files

**`backend/internal/room/manager.go`** — This is the brain. Every game event flows through here: creating rooms, starting games, handling guesses, ending rounds, calculating scores. If you want to understand game logic, read this file cover to cover.

**`frontend/components/providers/WebSocketProvider.tsx`** — This is the nervous system of the frontend. It opens the WebSocket connection, handles every incoming message type, and updates the Zustand store accordingly. Every UI component reacts to store changes triggered by this file.

**`backend/internal/room/game_state.go`** — The timer and round lifecycle. Uses Go channels (`chan struct{}`) to stop the countdown goroutine cleanly when a round ends early.

**`frontend/components/game/Canvas.tsx`** — The drawing surface. Handles mouse and touch events, converts CSS-pixel coordinates to internal canvas-pixel coordinates, paints lines, encodes binary packets, and receives remote draw events.

---

## How a Game Round Actually Flows

Let's trace a single round from start to finish, so you can see how all the pieces connect:

### 1. Room Creation
Player A visits the site, enters their name, and clicks "Create Room." The frontend sends a JSON WebSocket message: `{ type: "create_room", data: { playerName: "Alex" } }`. The backend creates a `Room` struct, adds the player, and responds with `room_info` containing the room ID and player list.

### 2. Joining
Player B visits, enters the room code, and sends `join_room`. The backend adds them to the room and broadcasts the updated `room_info` to everyone. The lobby shows both players.

### 3. Game Start
Player A (the owner) clicks "Start Game." The backend sends `game_started` to all players, then immediately calls `startNextRound()`.

### 4. Word Selection
`startNextRound()` picks the next drawer (rotating through `PlayerOrder`), selects 3 random words, and sends `word_choices` *only* to the drawer. To all other players, it sends `next_round` so they know who is choosing. The drawer sees a word-selection overlay; everyone else waits.

### 5. Drawing Begins
The drawer picks a word. The backend calls `HandleWordSelected()`, which starts the round (`StartRound()`), broadcasts `round_start` to all players (with the word hint, e.g. `_ _ _ _ _`), sends the actual word back to the drawer privately via `word_selected`, and spawns a goroutine running `StartTimer()`.

### 6. Strokes Happen
As the drawer moves their finger/mouse, `Canvas.tsx` encodes each stroke as a 12-byte binary packet and sends it over the WebSocket. The backend's Hub receives binary data, looks up the client's room, and calls `BroadcastBinaryExcept()` — sending the raw bytes to every other player. Those clients decode the packet and call `paintLine()` on their canvas.

### 7. Guessing
Other players type in the Chat input. The frontend sends `{ type: "guess", data: { text: "banana" } }`. The backend's `HandleGuess()` does a case-insensitive comparison against the secret word. Wrong guess? Broadcast it as a `chat` message. Right guess? Calculate points based on time remaining and guess order, mark the player as guessed, broadcast `correct_guess`. If everyone has guessed, end the round immediately.

### 8. Round End
`endRound()` awards the drawer their points too, broadcasts `round_end` with scores and the revealed word, then immediately calls `startNextRound()` again. After all rounds complete, `endGame()` finds the winner and broadcasts `game_over`.

---

## The Debugging Chronicles — Bugs That Actually Happened

This is where things get interesting. Every project has a gap between "the code I thought I wrote" and "the code that actually runs." Here are the real bugs we hit, what caused them, and how we fixed them.

---

### Bug 1: The Reconnect Death Loop

**Symptom:** The frontend connected to the Railway backend, appeared briefly in the logs as connected, then disconnected 1-2 seconds later. Over and over. Infinite reconnect loop. The game was completely unplayable.

**What we thought:** The backend was broken. Railway was misconfigured. CORS was wrong.

**What was actually wrong:** The `connect` function in `WebSocketProvider.tsx` had a dependency array listing every Zustand setter:

```ts
const connect = useCallback(() => {
  // ... opens WebSocket, sets up handlers
}, [setConnected, setPlayers, setPhase, setRoomId, setPlayerId, ...]);
```

In React, `useCallback` recreates the function whenever any dependency changes. The `useEffect` that calls `connect()` depends on `connect`. So: dependency changes → `connect` recreated → `useEffect` cleanup runs → **socket closed with code 1000** → reconnect guard checks `event.code !== 1000` → **blocks reconnection** → stuck.

The death loop was actually the socket being torn down by our own cleanup code on every render cycle.

**The fix:** Access Zustand setters via `useGameStore.getState()` *inside* the function, not as React dependencies. This makes `connect` a stable function with `[]` as its dependency array. `useEffect` runs exactly once on mount. The socket lives for the full session.

```ts
const connect = useCallback(() => {
  const { setConnected, setPlayers, ... } = useGameStore.getState();
  // ...
}, []); // zero deps — completely stable
```

**The lesson:** React's dependency arrays are a contract. Every value you use inside a `useCallback` or `useEffect` that can change should be in the dep array — *or* you should deliberately access it via a ref/store getter to opt out of the reactive system. Zustand's `getState()` is specifically designed to be used this way. It always returns current state without being a reactive dependency.

---

### Bug 2: The Railway Port Mystery

**Symptom:** Backend deployed to Railway. Health check at `https://scribblix-production.up.railway.app/health` returned 200 OK. But WebSocket connections failed with error code 1006 (abnormal closure, no response from server).

**What we thought:** CORS. Dockerfile. Go version. Binary format errors.

**What was actually wrong:** A manually set `PORT=8080` environment variable in Railway's dashboard. This sounds innocent but it's a fundamental misunderstanding of how Railway's networking works.

Railway's infrastructure works like this: your container starts on some random internal port that Railway assigns via its own `PORT` env var (e.g., `PORT=3847`). Railway's public-facing proxy then forwards incoming HTTPS/WSS traffic to that internal port. When you manually set `PORT=8080`, your Go server binds to 8080. But Railway's proxy is forwarding to `3847`. Connection refused. 1006.

**The fix:** Delete the manually set `PORT` variable from Railway's dashboard entirely. Let Railway inject its own `PORT`. The Go server code was already correct:

```go
port := os.Getenv("PORT")
if port == "" {
    port = "8080" // only used locally
}
```

**The lesson:** Platform-as-a-service providers (Railway, Render, Heroku, Fly.io) all do this. They own the port assignment. Your app's job is to listen on whatever `$PORT` says. Never hardcode a port in production deployment settings. The fallback default (`8080`) is for local development only.

---

### Bug 3: The Ghost Environment Variable

**Symptom:** Vercel-deployed frontend kept connecting to `ws://localhost:8080/ws` even after the backend was on Railway.

**What happened:** `.env.local` contains `NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws`. This file is in `.gitignore` and never committed. Vercel builds from the git repository. It has no access to `.env.local`. So `process.env.NEXT_PUBLIC_WS_URL` is `undefined` in the Vercel build, and the code falls back to `'ws://localhost:8080/ws'`.

**The fix:** Set `NEXT_PUBLIC_WS_URL=wss://scribblix-production.up.railway.app/ws` in Vercel's dashboard under Settings → Environment Variables, then redeploy.

**The lesson:** `.env.local` is for local development secrets only. Every deployment platform has its own environment variable system. Never assume your local env files reach production. Also: note the `wss://` not `ws://` — Vercel serves over HTTPS, and browsers block mixed content (an HTTPS page cannot open a plain WebSocket `ws://` connection).

---

### Bug 4: The Go Version That Didn't Exist

**Symptom:** Railway build failed with:
```
go: go.mod requires go >= 1.23.0 (running go 1.21.13; GOTOOLCHAIN=local)
```

**What happened:** The `go.mod` file had `go 1.25.0` — a version that doesn't exist. The Dockerfile used `FROM golang:1.21-alpine`, which ships Go 1.21. Go 1.21 refuses to build a module requiring Go 1.25.

Two fixes needed:
1. Change `go.mod` to `go 1.23.0` (a real, stable version)
2. Change the Dockerfile base image to `golang:1.23-alpine`

**The lesson:** Go's `go.mod` toolchain directive is strict. The version you write there must actually exist, and your build environment must be at least that version. Always keep these in sync. When in doubt, use the latest stable Go version on [go.dev/dl](https://go.dev/dl/).

---

### Bug 5: Mobile Drawing Errors

**Symptom:** On mobile, drawing triggered console errors:
```
Unable to preventDefault inside passive event listener invocation.
```

**What happened:** The `handleStart` and `handleMove` event handlers called `e.preventDefault()` to stop the page from scrolling while drawing. This is correct behavior — but React 18 registers touch event listeners as *passive* by default (a browser performance optimization that means `preventDefault()` is silently ignored AND throws an error).

**The attempted fix (wrong):** Add `touchAction: 'none'` CSS to the canvas element. This was the right direction but we hadn't removed the `preventDefault()` calls yet.

**The actual fix:** Remove `e.preventDefault()` from the React touch handlers entirely. The `touchAction: 'none'` CSS already tells the browser "don't handle native gestures on this element." That's all you need. You don't need `preventDefault()` anymore.

```tsx
// Before (errors)
const handleStart = (e) => {
  e.preventDefault(); // ❌ passive listener error
  ...
};

// After (clean)
const handleStart = (e) => {
  // no preventDefault needed — CSS handles it
  ...
};
```

**The lesson:** In modern browsers, touch event listeners are passive by default because it lets the browser scroll without waiting for your JS to run (huge performance win on mobile). If you need to actually block native touch behavior (scrolling, zooming), use CSS: `touch-action: none` on the element. Don't fight the browser with `preventDefault()` in passive listeners.

---

### Bug 6: The Timer Circle That Lived in Another Dimension

**Symptom:** The countdown timer SVG circle was visually misaligned — offset from the center of its container.

**What happened:** SVG `<circle>` elements with `cx` and `cy` coordinates are positioned in SVG coordinate space. Without a `viewBox`, the SVG coordinate space is whatever the element's rendered pixel size is — which changes with screen size and layout. The circle coordinates were written for one specific size and broke at others.

**The fix:** Add `viewBox="0 0 56 56"` to the `<svg>` element, then use fixed coordinates (`cx="28" cy="28" r="22"`) relative to that coordinate system. The `viewBox` makes the SVG coordinate space always `56×56` regardless of rendered size. The browser scales it to fit.

```tsx
<svg viewBox="0 0 56 56" className="absolute inset-0 w-full h-full -rotate-90">
  <circle cx="28" cy="28" r="22" ... />
</svg>
```

**The lesson:** Always use `viewBox` on SVGs that need to scale. Without it, your coordinate system is tied to the rendered pixel size. With it, you define a consistent logical coordinate space and let the browser handle the rest.

---

## How Drawing Actually Works on the Canvas

This deserves its own section because it's the most technically interesting UI piece.

The `<canvas>` element has two separate concepts of "size":
- **CSS size**: how big it looks on screen (e.g., `400px × 300px` after Tailwind/browser layout)
- **Internal resolution**: the pixel grid you actually draw on (set by `canvas.width` and `canvas.height`)

We fix the internal resolution at `800×600` always. The canvas is then displayed at whatever size the container allows via CSS `max-width: 100%; aspect-ratio: 800/600`.

When a user touches at position `(clientX, clientY)` in browser pixels, that doesn't map directly to the canvas's `800×600` grid. We have to convert:

```ts
const rect = canvas.getBoundingClientRect();
const x = ((clientX - rect.left) / rect.width) * 800;
const y = ((clientY - rect.top) / rect.height) * 600;
```

This proportional mapping works at any screen size and any zoom level. It's the right way to do canvas coordinate math.

Remote strokes arrive as binary packets. The `x1, y1, x2, y2` coordinates in those packets are already in the `800×600` internal space (because that's what the drawing client encoded). So remote paint calls go directly to `ctx.lineTo()` without any mapping needed.

---

## Concurrency in Go — Why It Matters Here

Go's concurrency model is worth understanding because it's used throughout the backend.

Every connected WebSocket client runs two goroutines:
- **ReadPump**: blocks waiting for incoming messages, processes them
- **WritePump**: blocks waiting on a buffered channel, sends outgoing messages

These goroutines communicate via channels, not shared memory. When you want to send a message to a client, you put it in the client's send channel. The WritePump picks it up and sends it. This means:
- No message is ever blocked on another message
- The Hub goroutine (which routes messages between rooms) never blocks on individual client writes
- If a client's connection is slow, the send channel fills up and that client is disconnected — without affecting anyone else

The timer is also a goroutine:

```go
go room.GameState.StartTimer(
    constants.RoundDuration,
    func(timeLeft int) { /* broadcast timer_update */ },
    func()            { /* end round */ },
)
```

A `chan struct{}` called `timerStop` is used to cancel the timer when a round ends early. Closing a channel in Go is a broadcast signal — all goroutines `select`-ing on that channel unblock simultaneously. Clean, no leaks.

---

## Things to Watch Out For (Pitfalls)

**Stale closures in React.** The `connect` callback bug is the canonical example. Any time you capture a value in a closure (function), it captures the value *at the time of creation*. If the value later changes but the function isn't recreated, you're using a stale reference. The fix is to either include the value in the dependency array (which recreates the function) or access the latest value via a ref/store getter.

**WebSocket close codes matter.** Code `1000` means "normal closure." Code `1006` means "abnormal closure (connection dropped without close frame)." Your reconnect logic should handle these differently. Don't reconnect on `1000` (that was intentional). Do reconnect on `1006` (that was unexpected).

**Platform PORT conventions.** Railway, Heroku, Render, Fly.io all inject `PORT`. Never hardcode it. Your server's only job is `listen(os.Getenv("PORT"))`.

**`wss://` vs `ws://`.** HTTPS pages cannot open `ws://` connections. Always use `wss://` in production. In local development, `ws://localhost` is fine.

**SVGs without viewBox.** Always include `viewBox`. Without it, coordinates are tied to rendered pixel size.

**Binary data in WebSockets.** Set `ws.binaryType = 'arraybuffer'` on the client before handling events. The default is `'blob'`, which requires async reading. `'arraybuffer'` is synchronous and immediately usable with `DataView`.

**Race conditions in Go.** Every shared struct in the backend (`Room`, `GameState`) uses `sync.RWMutex`. Read operations acquire a read lock (`RLock`). Write operations acquire a write lock (`Lock`). The pattern is always `defer mu.Unlock()` immediately after acquiring a lock. Forgetting this causes deadlocks.

---

## How Good Engineers Think About This Project

A few patterns worth internalizing from how this was built:

**Binary over JSON where it matters.** JSON is great for structured data like room info or chat messages. It's overkill for 12-byte draw packets sent 30 times per second. Know when to use each.

**Push state, don't poll.** The frontend never asks "what's the game state?" It receives state changes via WebSocket events and updates accordingly. This is reactive programming in practice.

**Use the platform.** `touch-action: none` is a CSS primitive that does exactly what you need. `viewBox` on SVGs is a browser feature. Don't fight the browser — work with it.

**One source of truth.** Zustand store is the single source of truth for the frontend. WebSocketProvider updates it. Components read from it. No component maintains its own copy of game state. This makes bugs much easier to trace.

**Defensive coding.** The backend checks `room.GameState.RoundStarted` before ending a round. It checks `room.IsEmpty()` before deleting a room. It checks `client.ID === currentDrawerId` before accepting a word selection. Guard clauses prevent the system from getting into illegal states.

**Log liberally during development.** Both the frontend (`[WS] Received:`, `[ROUND] startNextRound:`) and backend (`[ROOM] BroadcastExcept:`, `[WORD] HandleWordSelected:`) have detailed log statements. When something goes wrong in a distributed real-time system, you need a trail to follow. The Railway log that showed clients connecting and immediately disconnecting was what let us identify the reconnect loop bug.

---

## The Deployment Stack

```
User's Browser
     ↕ WSS (WebSocket Secure, port 443)
Vercel (Frontend)
     → Serves the Next.js app
     → NEXT_PUBLIC_WS_URL=wss://scribblix-production.up.railway.app/ws

Railway (Backend)
     → Runs the Docker container
     → Injects PORT automatically
     → Proxies external :443 → internal :PORT
     → Go server: gin router + gorilla/websocket
```

The Dockerfile is a two-stage build: the `builder` stage compiles the Go binary (producing a single self-contained executable), and the `run` stage copies only the binary and the word list into a minimal Alpine Linux image. The final image is tiny — no Go toolchain included.

---

## If You Come Back to This Project

The most likely things you'll want to add or fix:

- **Reconnect to an in-progress game**: currently if you disconnect mid-game you can't rejoin. This would require persisting player state server-side and associating reconnections by player name or token.
- **Partial word reveals**: the hint currently stays as all underscores. A nice feature is revealing one letter every 15 seconds.
- **Room settings**: rounds per game and draw time are hardcoded in `constants`. Exposing these to the room creator in the lobby is straightforward.
- **Mobile player list**: on mobile, the left sidebar (players) is hidden. There's a mobile chat overlay but no mobile player list overlay.

The codebase is clean and well-structured. Adding features means finding the right handler in `manager.go`, defining a new event type in `constants`, and handling it in `WebSocketProvider.tsx`. The pattern is consistent throughout.

---

*Built with Go, Next.js, Zustand, Tailwind CSS, Framer Motion, and a healthy respect for WebSocket close codes.*
