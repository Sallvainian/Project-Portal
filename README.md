# Taskade Portal — Reconstructed Source

Working React + TypeScript source for the "Portal Assistant" Genesis app,
**reconstructed by decompiling the production bundle** that the preview served
to the browser (`genesis-preview.taskade.com`). Export from Genesis is
paywalled and no source maps were published, so this was rebuilt from the
minified `assets/main-W5LBMJ45.js`.

## ⚠️ Faithful reconstruction, not the literal originals

- **Behavior, JSX structure, classNames, API calls, and all UI text are
  reproduced verbatim** from the bundle — these survive minification intact.
- **Component/file names are inferred.** The bundle's identifiers were mangled
  (`NS`, `BS`, `G`, `$l`, …); names here (`Dashboard`, `cn`, `api`, …) are
  reconstructions, not the originals. Code comments from the original are gone.
- **A few icons are inferred.** lucide ships 27 icons in this app (confirmed by
  the bundle's license manifest) and the code references exactly 27 distinct
  icon slots, but the minified aliases don't carry the icon names. The
  confident matches are exact; two in the file/folder/chart family are
  best-guesses and marked below.

**Verification status:**
- ✅ Type-checks — `tsc --noEmit`, 0 errors.
- ✅ Builds — `vite build`; output 464.7 kB vs. the original 476.7 kB (~2% — same
  dependency set, same app).
- ✅ Renders — headless load mounts React into `#root`, nav shows
  Dashboard/Projects/Files/Messages, the Dashboard and chat FAB render, and the
  only runtime errors are the expected data-fetch failures handled by the app's
  own `catch` blocks.
- ❌ Not verified against the **live Taskade API** — the `/api/taskade` gateway
  needs Taskade's short-lived access token, so live projects/files/messages/chat
  data was not exercised. The file most worth re-reading if the chat ever
  misbehaves is `src/hooks/useAgentChat.ts` (the only intricate hand-transcribed
  logic — stream reconciliation + ref bookkeeping — as opposed to mechanical JSX).

## Run

```bash
npm install
npm run dev      # http://localhost:5173
```

The app talks to Taskade through a same-origin `/api/taskade/*` prefix. In the
Genesis preview, Taskade's gateway proxies that. Locally, `vite.config.ts`
proxies it to `https://www.taskade.com` (override with `TASKADE_GATEWAY_URL`).
Those calls will 401 without Taskade's gateway/access token, so projects/files/
messages/chat won't load with live data until you wire up auth — but the full
UI, navigation, theming, and animations run.

## What it is

A client-portal app with four tabs + a floating AI chat assistant:

| Tab / feature   | Component                         | Backend |
|-----------------|-----------------------------------|---------|
| Dashboard       | `src/components/Dashboard.tsx`     | projects + messages |
| Projects        | `src/components/Projects.tsx`      | projects |
| Files           | `src/components/Files.tsx`         | files |
| Messages        | `src/components/Messages.tsx`      | messages (read/compose) |
| Portal Assistant| `src/components/PortalAssistant.tsx` | Taskade AI agent (SSE) |

### Backend = Taskade API (no separate server)

Everything is Taskade projects, proxied at `/api/taskade` (`src/api/taskade.ts`):

| Data     | Taskade project ID  |
|----------|---------------------|
| Projects | `taTBPPgRY5gQfoab`  |
| Messages | `i4ZFqvqkgAjtNRYB`  |
| Files    | `CfsTRpBumokQrw9s`  |

The chat is a Taskade AI agent (`AGENT_ID = 01KT2XM2MHQJD0Z1D8S1VJGXXT`):
create a public conversation, POST messages, stream tokens back over an
`EventSource` (`src/api/agentChat.ts` + `src/hooks/useAgentChat.ts`).

### Taskade node field keys

Each record is a Taskade node; the UI reads `fieldValues`:

- Projects: `@proj2` name · `@cli01` client · `@stat3` status · `@prio7` priority
  · `@prog4` progress% · `@budg6` budget · `@due05` due date
- Messages: `@from8` from · `@subj0` subject · `@msg11` body · `@type2` type
  · `@clie9` client · `@read3` read state (`opt-read`/`opt-unread`)
- Files: `@file4` name · `@ftyp6` type · `@proj5` project · `@upld8` date
  · `@upby9` uploaded-by · `@vers0` version · `@furl1` URL

Option ids and their labels/colors live in `src/constants.ts`.

## Project layout

```
src/
├── main.tsx                  entry: StrictMode > next-themes > App
├── App.tsx                   tab nav, theme toggle, animated background, footer
├── index.css                 design tokens (recovered) + float-up keyframe
├── constants.ts              project/agent IDs, status/priority/file maps
├── types.ts                  TaskadeNode, ChatMessage
├── lib/utils.ts              cn() classnames helper
├── api/
│   ├── taskade.ts            axios client: projects / messages / files
│   └── agentChat.ts          agent REST + AgentChatStream (SSE) + zod schema
├── hooks/useAgentChat.ts     React binding for the chat stream
└── components/               Dashboard, Projects, Files, Messages,
                              PortalAssistant, FloatingParticles
```

## Inferred icon mappings (verify if it matters to you)

Confident: LayoutDashboard, Mail, Sparkles, Sun, Moon, DollarSign, Calendar,
Funnel, Search, Lightbulb, Plus, Check, X, Send, Bell, TriangleAlert,
MessageCircle, LoaderCircle, ExternalLink, Folder, FolderOpen, FileText,
TrendingUp, CircleCheck, File.

Best-guess (cosmetic only — swap if it looks off against the live app):
- `Projects.tsx` "Priority" → **ChartColumn** (could be TrendingUp)
- `Files.tsx` file-is-a-link indicator → **Download** (could be ExternalLink)
