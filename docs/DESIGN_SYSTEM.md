# Design system "Corgi Studio"

## 1. Principle

The product has one calm interface layer and several independent game worlds.

- The tutor interface, navigation, forms, library, statistics and system messages always use a common neutral-turquoise system.
- The background and decorative atmosphere of the game can change: underwater world, space, paper workshop, arcade city.
- The content of the task remains readable and does not inherit the random decorative colors of the game world.
- Green means save, correct answer, or completed action. Red is only used for error or deletion.

## 2. Basic colors

| Role | Token | Meaning |
| --- | --- | --- |
| Product background | `--ds-canvas` | `#F5F7F8` |
| In-depth background | `--ds-canvas-deep` | `#EDF2F3` |
| Main surface | `--ds-surface` | `#FFFFFF` |
| Calm surface | `--ds-surface-soft` | `#F8FAFB` |
| Milk game card | `--ds-surface-warm` | `#FBFAF6` |
| Body text | `--ds-ink` | `#18212D` |
| Secondary text | `--ds-muted` | `#647383` |
| Border | `--ds-border` | `#D5DDE4` |
| Interactive accent | `--ds-accent` | `#138B8F` |
| Hover Accent | `--ds-accent-hover` | `#0D7478` |
| Background of the selected element | `--ds-accent-soft` | `#E2F3F2` |
| Retention and Success | `--ds-success` | `#15945B` |
| Error | `--ds-error` | `#E84D55` |
| Warning | `--ds-warning` | `#D6A526` |
| Dark color of the themed world, not the system panel | `--ds-dark` | `#06394A` |

## 3. Typography

- Main font: `Onest Variable`.
- Regular text: 450–500.
- Captions and controls: 540–620.
- Headlines and Key Actions: 650–700.
- Numerical indicators use tabular figures.
- Caps are allowed only for short service marks; the main interface uses normal case.

## 4. Geometry

| Element | Radius |
| --- | --- |
| Small inner element | `6px` |
| Field, button, menu item | `8px` |
| Card inside panel | `12px` |
| Main panel | `16px` |
| Large promo block | `20px` |

The shadows are a cool turquoise gray and show hierarchy rather than decorating each block.

## 5. Components and states

### Buttons

- Main action: turquoise fill.
- Save: green fill.
- Secondary action: white surface and gray border.
- Remove: Red text and soft red background only on hover or confirmation.
- Press: shift by `1px` and scale `0.985`.
- Focus: visible turquoise ring.

### Choice

- The active tab or menu item uses `--ds-accent-soft` and turquoise text.
- An inactive element does not receive a color fill.
- The switch uses turquoise only when on.

### Feedback

- The correct answer is: a green line, an icon, or a soft green background.
- Error: Coral red line or soft red background.
- Neutral process: turquoise indicator.
- Color is not the only indication of status: there is always text or an icon.

## 6. Game worlds

System headers, navigation and player panels remain light in all worlds. Dark color is only allowed within the chosen thematic scene - for example, space or the underwater world - and should not turn into a constant heavy stripe around the task.

The game theme can change:

- stage background;
- decorative light and texture;
- illustration and character;
- local color of the connecting line or progress.

The game theme does not change:

- shell system buttons;
- the meaning of green and red;
- font and basic readability;
- card structure and focus availability;
- task editor.

## 7. Implementation

The main layer is in `app/design-system.css` and connects after the historical files `globals.css` and `lab.css`. It contains tokens, backwards compatibility with old variables, and final rules for common components.

New components must use `--ds-*` directly. Old variables `--blue`, `--teal`, `--lab-blue` are saved as compatible aliases and should not appear in new code.
