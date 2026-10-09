# Game redesign process and unified visual system

From October 8, 2026, the current queue is determined by [island game plan](ISLAND_GAMES_IMPLEMENTATION_PLAN.md): base defense, expedition, investigation, joint adventure. The order of the six basic patterns described below is retained as the previous step; it does not replace a new queue.

## 1. Decision made

The six existing games are not being remade at the same time. Each goes through the same sequential process:

1. **Training contract.** What exactly the game trains and what types of data it is suitable for.
2. **Creating variations.** How the teacher and AI create different correct sets of content.
3. **Game mechanics** Rules, controls, states, feedback and completion.
4. **Visual scenario.** Screen composition, hierarchy, motion and adaptability.
5. **Mock-up picture.** Highly detailed concept before changing the working renderer.
6. **Visual confirmation.** We only specify the composition and style, while changes are cheap.
7. **Layout.** We implement the confirmed screen using native DOM/CSS/Canvas tools.
8. **Check.** Desktop, mobile, keyboard, touch, reduced motion and real passage.

The layout is a visual task, not a game asset. Text, cards, buttons and interface remain native and accessible during implementation.

## 2. What does "variation" mean?

In this process, variation is not a random change of color or a new game with the same name.

There are three different levels:

| Level | What's changing | Example for "Couples" |
| --- | --- | --- |
| Content variation | Training data | term ↔ definition, formula ↔ quantity, event ↔ date |
| Round Mode | Compatible Data Feed | connect with lines, select matches one by one |
| Experience preset | Age tone without changing the rules | teenage, neutral, adult |

If the student's main action loop changes, this is a separate renderer. For example, searching for identical cards face down is not a variant of connecting with lines, but an independent memory mechanic.

## 3. Unified art direction: “Living educational system”

### Character

The interface should be:

- modern, light and fast;
- alive and playful for a child or teenager, but not infantile for an adult;
- expressive without dark “gamer” overload;
- seamless in all objects and renderers;
- built around a learning activity, and the corgi coach must give it a recognizable character.

The visual metaphor is LessonQuest's friendly digital playground, in which cards, connections, and objects feel physical: they attract, stack, sort, and react to action. Corgi does not close the stage and does not comment on every click: he meets before the round, helps in case of difficulty, reacts to an important result and appears at the end.

### Basic palette

| Token | Meaning | Application |
| --- | --- | --- |
| `canvas` | `#F4F8FA` | general light background |
| `surface` | `#FFFFFF` | cards and panels |
| `ink` | `#172033` | main text |
| `muted` | `#667085` | secondary text |
| `primary` | `#0CA6A3` | corgi brand, main action and active object |
| `secondary` | `#1768DF` | game connections, progress and focus |
| `warm` | `#FF9B52` | rare warm corgi color accent |
| `success` | `#22A06B` | correct result |
| `danger` | `#E5484D` | error |
| `attention` | `#F5A524` | prompt and expectation of action |
| `border` | `#E4E8F0` | calm boundaries |

The background may have soft turquoise blue flecks, small paw prints or trail lines, but the central teaching area remains light. Warm orange is used as a spot color and not as a second primary color. No black game bars by default.

### Corgi as part of the system

Uses existing assets `public/corgi-logo-concept.png` and `public/corgi-dog-cutout-v2.png`; a new unrelated mascot is not generated.

- **Intro:** A medium-sized corgi shows action with one gesture or short statement.
- **Hint:** the head or paw appears on the compact hint without overlapping the card.
- **Correct streak / important success:** short reaction without constant speech bubble.
- **Error:** the corgi does not appear ashamed or upset; It helps to try differently.
- **Result:** a full reaction and a clear next step.
- **Professional Calm:** Corgis are smaller and appear less often, but the brand does not disappear.

Having a large character standing next to every game scene isn't necessary: ​​it wastes space on the phone and quickly turns the support into visual noise.

### Typography

- interface: `Manrope` or `Inter`, depending on the already connected stack;
- round title: 28–36 px, weight 700–750;
- main card text: 18–24 px, weight 650–700;
- service signatures: 12–14 px, weight 600;
- capslock is used only for short statuses, not for instructions;
- the adult preset does not make the text smaller and does not make the interface “gray office”.

### Shapes and depth

- main card radius: 20–24 px;
- radius of buttons and compact HUD elements: 12–16 px;
- thin border and two levels of soft shadow;
- the dragged object appears to have a lift, rather than a strong increase;
- game connections and trajectories have a thickness of at least 4 px;
- decorative objects do not compete with clickable ones.

### General game shell

All renderers use the same framework:

1. top line: exit, progress, sound, pause;
2. round title and instructions;
3. central playing stage;
4. short context clue;
5. feedback on top of the stage, rather than in a separate heavy sidebar;
6. final screen in the same visual system.

### Unified motion language

| Event | Movement | Duration |
| --- | --- | --- |
| Pressing | compression to 0.98 and return | 120–160 ms |
| Raising the card | shadow + offset 4–6 px | 160–220 ms |
| Correct | magnetic connection + soft green wave | 260–420 ms |
| Error | short deviation, red outline, return | 220–320 ms |
| New round | shift and dissolve without completely rebooting the scene | 300–450 ms |
| Completion | collection of objects into the final composition | up to 700 ms |

V `prefers-reduced-motion` movement is replaced by a change of state and opacity lasting up to 120 ms.

### Experience presets

The rules and dimensions of the interface remain the same. Only the tone changes:

- **Corgi Play** - main live mode for children and early teens, with more prominent coaching;
- **Teen Pulse** - energetic turquoise blue accents and short play signatures without child embellishments;
- **Studio Light** - balanced mode for most items;
- **Professional Calm** - calmer motion, corgi appears only in key states, suitable for adults and Business English;
- **High Contrast** - enhanced borders, minimum glow, increased contrast.

## 4. What do all games have in common?

The same components cannot be re-drawn for each renderer:

- `GameShell`;
- `RoundHeader`;
- `ProgressPill`;
- `GameCard`;
- `FeedbackToast`;
- `HintButton`;
- `PauseSheet`;
- `ResultScreen`;
- `CorgiCoach` with options `intro / hint / success / result`;
- color and motion tokens;
- sound categories `tap / lift / correct / error / complete`.

Each game has its own scene and interaction physics. Unity is built on the shell, typography, materials, states and motion language, and not on the same layout of cards.

## 5. The order of development of existing games

| Order | Game | Why now |
| --- | --- | --- |
| 1 | Couples | defines basic cards, connections, drag/tap and feedback |
| 2 | Groups | reuses cards and adds zones and sorting |
| 3 | Blitz quiz | sets the standard for choice, explanation and pace |
| 4 | Memory Deck | reinforces a calm regime and an adult presentation |
| 5 | Find the error | requires precise work with text tokens and diagnostics |
| 6 | Forces Laboratory | the most domain-specific scene and complex canvas interaction |

After six basic renderers, the first arcade is created `Portal Rush` on already tested quiz content.

## 6. Definition of Done for one game

A game is considered remastered only when:

- the specification of its content schema and AI restrictions has been published;
- acceptable and unacceptable variations are listed;
- the complete state machine is described;
- the visual layout is confirmed before layout;
- the implementation is consistent with the overall design system;
- the mouse, touch and keyboard work correctly;
- desktop and 390 × 844 do not have horizontal scrolling;
- the error state explains the action, not just changes the color;
- long-form Russian text and formulas do not break the scene;
- an adult example looks natural without child clipart;
- a completed attempt saves the correct result;
- `eslint`, TypeScript and production build run without errors.

## 7. Artifacts for every game

A separate folder or set of files is created for each game:

```text
docs/games/<game>/
  SPEC.md # content, variations, mechanics, states
  VISUAL_BRIEF.md # composition and exact layout prompt
  mockup-desktop-v1.png # visual reference to be approved
  mockup-mobile-v1.png # after selecting desktop direction
```

The working renderer changes only after the appearance `SPEC.md` and a confirmed desktop layout.
