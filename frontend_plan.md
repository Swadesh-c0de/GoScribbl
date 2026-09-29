# Frontend Implementation Plan - ScrrblIX

A comprehensive Next.js frontend for a real-time multiplayer drawing game with Tailwind CSS, Framer Motion, shadcn/ui, and facehash avatars.

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | App Router, SSR, API routes |
| **Tailwind CSS** | Utility-first styling |
| **Framer Motion** | Animations & transitions |
| **shadcn/ui** | UI components (buttons, dialogs, inputs) |
| **facehash** | Unique avatar generation from player name |
| **TypeScript** | Type safety |

---

## Screens Analysis (from Reference Images)

### 1. Home/Landing Page (`/`)
**Reference**: Screenshot_000520, Screenshot_000722

**Elements**:
- Logo/branding at top
- Name input field
- Language selector (optional for MVP)
- **"Play!"** button (quick match - not implementing)
- **"Create Private Room"** button
- About section, News section, How to Play section (footer area)

**Our Implementation**:
- Name input with validation (2-15 chars)
- **facehash** avatar preview (generated from name in real-time)
- "Create Room" button
- "Join Room" button with room code input
- Clean, modern UI with blue gradient background (like original)

---

### 2. Lobby/Waiting Room (`/room/[roomId]`)
**Reference**: Screenshot_000609, Screenshot_000736

**Elements**:
- Header: Timer (0), Round indicator (Round 1 of 3), "WAITING" status
- Left sidebar: Player list with avatars, names, scores, rank (#1, #2...)
- Center panel: Room settings (only room owner can modify)
  - Players count
  - Language
  - Draw time (80s default)
  - Rounds (3 default)
  - Game Mode
  - Word Count
  - Hints
  - Custom words textarea
- Bottom: "Start!" button (green), "Invite" button (blue)
- Right panel: Chat area with "Type your guess here..." input
- Settings gear icon (top right)

**Room Owner Features**:
- Can modify settings
- Can start game
- Crown icon on avatar

**Invite Modal** (Screenshot_000736):
- Player avatar with crown
- "Invite your friends!" text
- "Click to copy Invite" button (copies room URL)

---

### 3. Game Screen - Drawing Phase
**Reference**: Screenshot_000634, Screenshot_000934

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ [Timer] Round X of 3          GUESS THIS: _ _ _ d _ e      │
├──────────┬────────────────────────────────┬─────────────────┤
│ Players  │                                │  👍  👎        │
│ #1 Name  │                                │                 │
│ #2 Name  │        CANVAS (800x600)        │  Chat Messages  │
│ #3 Name  │                                │  - joined       │
│ ...      │                                │  - guessed!     │
│          │                                │  - wrong guess  │
├──────────┴────────────────────────────────┴─────────────────┤
│ [Drawing Tools - only for drawer]         [Guess Input]     │
└─────────────────────────────────────────────────────────────┘
```

**Header**:
- Circular timer with countdown (animated)
- Round indicator
- Word hint display: `_ _ _ d _ e` (underscores for hidden letters)
- Superscript number showing word length

**Left Sidebar - Player List**:
- Rank (#1, #2, etc.) based on score
- Player name (highlighted if "You")
- Score display
- Avatar (facehash generated)
- Visual indicator when player guesses correctly (green highlight)
- Pencil icon next to current drawer

**Center - Canvas**:
- 800x600 white canvas
- Drawing tools (only visible to drawer):
  - Color palette
  - Brush sizes
  - Eraser
  - Fill tool
  - Undo
  - Clear canvas
- Thumbs up/down buttons for rating drawing

**Right Sidebar - Chat**:
- System messages (green background):
  - "X joined the room!"
  - "X left the room!"
  - "X guessed the word!" (correct guess)
  - "The word was 'puddle'"
  - "X is drawing now!"
- Player messages (white background):
  - Wrong guesses shown as chat
  - Format: "PlayerName: guess text"
- Input field: "Type your guess here..."

---

### 4. Word Selection Phase (Drawer Only)
**Reference**: Screenshot_000900

**Overlay on canvas**:
- "[PlayerName] is choosing a word!" message
- Drawer sees 3 word options as buttons
- Timer counting down for selection
- If no selection, random word chosen

---

### 5. Round End Screen
**Reference**: Screenshot_001003 (partial)

**Elements**:
- "The word was '[word]'" message (yellow/orange)
- Updated scoreboard
- Brief pause before next round

---

### 6. Game Over Screen

**Elements**:
- Winner announcement with crown
- Final leaderboard
- All player avatars with scores
- "Play Again" button
- "Back to Lobby" button

---

### 7. Settings Modal
**Reference**: Screenshot_000645

**Elements**:
- Volume slider
- Hotkeys configuration (Brush: B, Fill: F, Undo: U, Clear: C, Swap: S)
- Miscellaneous settings
- Close button (X)

---

### 8. Player Interaction Modal
**Reference**: Screenshot_000756

**When clicking on a player**:
- Player avatar (large)
- Player name
- "Votekick" button
- "Mute" button
- "Report" button

---

## Core Logic Extracted

### Word Hint Progressive Reveal
**From Screenshot_000934**: `_ _ _ d _ e` for "puddle"

**Logic**:
1. Initially all letters are underscores `_`
2. As players make **close guesses**, letters are revealed
3. Backend sends updated `wordHint` via `round_start` or new event
4. Spaces are shown as spaces, not underscores

**Implementation**:
```typescript
// Display hint with spacing
const displayHint = (hint: string) => {
  return hint.split('').map((char, i) => (
    <span key={i} className={char === '_' ? 'text-gray-400' : 'text-black'}>
      {char === ' ' ? '\u00A0\u00A0' : char}
    </span>
  ));
};
```

### Scoring System (from backend)
- **Guesser**: 100-500 points based on time remaining + order bonus
- **Drawer**: Points based on % of players who guessed

### Chat Message Types
| Type | Color | Example |
|------|-------|---------|
| Join | Green | "X joined the room!" |
| Leave | Orange | "X left the room!" |
| Correct Guess | Green | "X guessed the word!" |
| Drawing | Blue | "X is drawing now!" |
| Word Reveal | Yellow | "The word was 'puddle'" |
| Wrong Guess | White | "PlayerName: wrong guess" |
| Like Drawing | Green | "X liked the drawing!" |

---

## Component Structure

```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                 # Home/Landing
│   ├── room/
│   │   └── [roomId]/
│   │       └── page.tsx         # Game room
│   └── globals.css
├── components/
│   ├── ui/                      # shadcn components
│   ├── home/
│   │   ├── NameInput.tsx
│   │   ├── AvatarPreview.tsx
│   │   └── JoinRoomDialog.tsx
│   ├── lobby/
│   │   ├── LobbySettings.tsx
│   │   ├── InviteModal.tsx
│   │   └── WaitingOverlay.tsx
│   ├── game/
│   │   ├── Canvas.tsx           # Drawing canvas with tools
│   │   ├── DrawingTools.tsx     # Color picker, brush size, etc.
│   │   ├── PlayerList.tsx       # Left sidebar
│   │   ├── ChatPanel.tsx        # Right sidebar
│   │   ├── WordHint.tsx         # Top hint display
│   │   ├── Timer.tsx            # Circular countdown
│   │   ├── WordSelection.tsx    # Drawer word choice overlay
│   │   ├── RoundEnd.tsx         # Round end overlay
│   │   └── GameOver.tsx         # Final results
│   ├── shared/
│   │   ├── Avatar.tsx           # facehash wrapper
│   │   ├── Header.tsx
│   │   └── SettingsModal.tsx
│   └── providers/
│       └── WebSocketProvider.tsx
├── hooks/
│   ├── useWebSocket.ts          # WebSocket connection & events
│   ├── useGame.ts               # Game state management
│   ├── useCanvas.ts             # Canvas drawing logic
│   └── useSound.ts              # Sound effects (optional)
├── lib/
│   ├── constants.ts             # Event types, config
│   ├── types.ts                 # TypeScript interfaces
│   ├── protocol.ts              # Binary protocol encode/decode
│   └── utils.ts
├── stores/
│   └── gameStore.ts             # Zustand store for game state
└── public/
    └── sounds/                  # Sound effects (optional)
```

---

## Implementation Phases

### Phase 1: Project Setup
- [ ] Initialize Next.js 14 with App Router
- [ ] Install dependencies: tailwindcss, framer-motion, facehash
- [ ] Setup shadcn/ui
- [ ] Configure Tailwind with custom colors (skribbl blue theme)
- [ ] Create base layout and global styles

### Phase 2: Home Page
- [ ] Create landing page layout (blue gradient background)
- [ ] Name input with validation
- [ ] Real-time facehash avatar preview
- [ ] "Create Room" button → calls backend, redirects to /room/[id]
- [ ] "Join Room" dialog with room code input
- [ ] Footer sections (About, How to Play)

### Phase 3: WebSocket Infrastructure
- [ ] Create WebSocketProvider context
- [ ] Implement connection management
- [ ] Handle all event types from backend
- [ ] Binary protocol for drawing data
- [ ] Reconnection logic

### Phase 4: Lobby Screen
- [ ] Room layout with 3-column design
- [ ] Player list component with facehash avatars
- [ ] Room settings panel (owner only)
- [ ] Chat panel (reused in game)
- [ ] Invite modal with copy link
- [ ] Start game button (owner only, min 2 players)

### Phase 5: Game Canvas
- [ ] HTML5 Canvas component (800x600)
- [ ] Drawing tools (colors, brush sizes, eraser, fill, undo, clear)
- [ ] Binary protocol encoding for strokes
- [ ] Receive and render strokes from other players
- [ ] requestAnimationFrame rendering loop
- [ ] Touch support for mobile

### Phase 6: Game UI
- [ ] Circular timer with Framer Motion animation
- [ ] Word hint display with letter reveal
- [ ] Player list with scores and rank
- [ ] Chat panel with message types
- [ ] Thumbs up/down buttons

### Phase 7: Game Flow
- [ ] Word selection overlay (drawer)
- [ ] Round start/end transitions
- [ ] Score updates with animations
- [ ] Game over screen with winner
- [ ] Play again functionality

### Phase 8: Polish & Animations
- [ ] Framer Motion page transitions
- [ ] Player join/leave animations
- [ ] Correct guess celebration
- [ ] Score increment animation
- [ ] Canvas clear animation
- [ ] Loading states

### Phase 9: Settings & Extras
- [ ] Settings modal (volume, hotkeys)
- [ ] Player interaction modal (mute, votekick)
- [ ] Keyboard shortcuts
- [ ] Mobile responsive design
- [ ] Error handling & toasts

---

## WebSocket Events Mapping

### Client → Server
| Event | Data | When |
|-------|------|------|
| `create_room` | `{ playerName }` | Create new room |
| `join_room` | `{ roomId, playerName }` | Join existing room |
| `leave_room` | - | Leave current room |
| `start_game` | - | Owner starts game |
| `word_selected` | `"word"` | Drawer picks word |
| `guess` | `{ text }` | Player submits guess |
| `clear_canvas` | - | Drawer clears canvas |
| Binary draw data | `[tool, color, size, x1, y1, x2, y2]` | Drawing strokes |

### Server → Client
| Event | Data | Action |
|-------|------|--------|
| `room_info` | `{ roomId, players[] }` | Update room state |
| `game_started` | - | Transition to game |
| `word_choices` | `{ words[] }` | Show word options (drawer) |
| `round_start` | `{ round, drawerId, drawerName, wordLength, wordHint }` | Start round |
| `timer_update` | `{ timeLeft }` | Update timer |
| `correct_guess` | `{ playerId, playerName, points }` | Show correct guess |
| `chat` | `{ playerId, playerName, text }` | Show wrong guess |
| `round_end` | `{ word, scores[] }` | Show round results |
| `game_over` | `{ winner, scores[] }` | Show final results |
| `error` | `{ message }` | Show error toast |
| Binary draw data | bytes | Render on canvas |

---

## State Management (Zustand)

```typescript
interface GameState {
  // Connection
  connected: boolean;
  playerId: string | null;
  playerName: string;
  
  // Room
  roomId: string | null;
  players: Player[];
  isOwner: boolean;
  
  // Game
  gamePhase: 'lobby' | 'choosing' | 'drawing' | 'roundEnd' | 'gameOver';
  currentRound: number;
  totalRounds: number;
  timeLeft: number;
  
  // Drawing
  currentDrawerId: string | null;
  isDrawer: boolean;
  wordHint: string;
  wordChoices: string[] | null;
  selectedWord: string | null;
  
  // Chat
  messages: ChatMessage[];
}
```

---

## Key UI Components Detail

### Avatar Component (facehash)
```typescript
import { createAvatar } from 'facehash';

const Avatar = ({ name, size = 48 }) => {
  const avatarSvg = createAvatar(name);
  return (
    <div 
      className="rounded-full overflow-hidden"
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: avatarSvg }}
    />
  );
};
```

### Timer Component
- Circular progress using SVG
- Framer Motion for smooth countdown
- Color changes: green → yellow → red as time decreases
- Pulse animation in last 10 seconds

### Canvas Component
- HTML5 Canvas with 2D context
- Event handlers: mousedown, mousemove, mouseup, touchstart, touchmove, touchend
- Line smoothing with quadratic curves
- Binary encoding: `[msgType, tool, color, size, x1, y1, x2, y2]`
- Batched sending every 16ms (60 FPS)

---

## Color Palette (Skribbl-inspired)

```css
:root {
  --bg-primary: #3b82f6;      /* Blue background */
  --bg-secondary: #1e40af;    /* Darker blue */
  --panel-bg: #1e3a5f;        /* Panel background */
  --text-primary: #ffffff;
  --text-secondary: #94a3b8;
  --accent-green: #22c55e;    /* Start button, correct guess */
  --accent-blue: #3b82f6;     /* Invite button */
  --accent-yellow: #eab308;   /* Word reveal */
  --accent-orange: #f97316;   /* Leave message */
}
```

---

## Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwindcss": "^3.4.0",
    "framer-motion": "^11.0.0",
    "facehash": "^1.0.0",
    "zustand": "^4.5.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-slot": "^1.0.0",
    "class-variance-authority": "^0.7.0",
    "lucide-react": "^0.300.0"
  }
}
```

---

## File-by-File Implementation Order

1. `lib/types.ts` - TypeScript interfaces
2. `lib/constants.ts` - Event types, colors
3. `stores/gameStore.ts` - Zustand store
4. `hooks/useWebSocket.ts` - WebSocket hook
5. `components/shared/Avatar.tsx` - facehash wrapper
6. `app/page.tsx` - Home page
7. `components/home/*` - Home components
8. `app/room/[roomId]/page.tsx` - Room page
9. `components/lobby/*` - Lobby components
10. `hooks/useCanvas.ts` - Canvas logic
11. `lib/protocol.ts` - Binary protocol
12. `components/game/Canvas.tsx` - Drawing canvas
13. `components/game/*` - Game components
14. Animations and polish
