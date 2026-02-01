# 🟣 LOCAPRO — Brand Guidelines & Design System

**SaaS Name:** Locapro  
**Tagline:** *Votre agence, sous contrôle*

---

## Logo Asset

![Locapro Logo](/assets/locapro-logo.png)

The primary logo file lives at `public/assets/locapro-logo.png` for use across the app (login, dashboard header, favicon, etc.).

---

## 1. Brand Foundations

### Brand Name
**Locapro**

- Derived from *Location + Pro*
- Short, professional, easy to pronounce in French, Arabic, and English
- Designed to sound reliable and operational

### Tagline
**Votre agence, sous contrôle**

This tagline communicates:
- Control
- Clarity
- Trust
- Daily operational mastery

---

## 2. Brand Personality

Locapro should feel:

- Professional
- Reliable
- Calm
- In control
- Serious but approachable

Locapro should **not** feel:
- Playful
- Flashy
- Overly "startup hype"
- Experimental

> Locapro is a tool agencies trust with their cars, money, and clients.

---

## 3. Logo Usage

### Primary Logo
- Icon + wordmark `locapro`
- Lowercase typography (modern and confident)
- Dark text on light backgrounds preferred

### Logo Icon Meaning
- Overlapping shapes → coordination, flow, control
- Gradient → modern SaaS
- Rounded geometry → approachable but professional

### Do
- Use generous white space
- Keep logo flat (no shadows)
- Use full logo on dashboard and marketing pages

### Don't
- Stretch or distort
- Rotate or skew
- Modify gradient colors
- Add drop shadows

---

## 4. Color System
**Theme: Midnight Steel × Violet**

### Primary Brand Color

**Primary Violet**
- Hex: `#6D5EF7`
- Usage:
  - Primary CTAs
  - Active states
  - Highlights
  - Key actions

---

### Dark UI Base (Midnight Steel)

- Background Dark: `#0F172A`
- Card / Surface Dark: `#111827`

---

### Neutral Colors

- White: `#FFFFFF`
- Gray 50: `#F9FAFB`
- Gray 100: `#F3F4F6`
- Gray 300: `#D1D5DB`
- Gray 600: `#4B5563`
- Gray 900: `#111827`

> White space is intentional. Neutral-heavy UI = premium SaaS feel.

---

### Semantic Colors

#### Success
- `#16A34A`
- Paid, Available, Completed

#### Warning
- `#F59E0B`
- Returns today, Deposits held

#### Danger
- `#DC2626`
- Late returns, Unpaid, Action Requise

#### Info
- `#2563EB`
- Operations, neutral notices

---

## 5. Typography

### Font Family
**Inter**

### Type Scale

- Page title: `text-2xl font-semibold`
- Section title: `text-lg font-medium`
- Body text: `text-sm`
- Caption / meta: `text-xs text-gray-500`
- Financial numbers: `font-semibold tracking-tight`

### Rules
- No decorative fonts
- Avoid ALL CAPS (except badges)
- Financial numbers must always be clear and bold

---

## 6. Core UI Principles

### 1. Operations > Analytics
The UI must prioritize:
- What's wrong
- What's happening today
- Where the money is

Analytics are secondary.

### 2. Calm Urgency
- Red is used sparingly
- Problems are visible but not alarming
- UI guides the user to action

### 3. One-Click Actions
Every critical issue must have:
- A visible action
- No hidden menus

---

## 7. Component Design System

### Buttons

#### Primary Button
- Background: Violet
- Text: White
- Border radius: `rounded-md`
- Usage: Main actions (Nouvelle réservation, Créer)

#### Secondary Button
- Background: White
- Border: Gray
- Usage: Cancel, View, Secondary actions

#### Danger Button
- Background: Red
- Usage: Destructive actions only

---

### Badges

Status-driven UI using compact badges:

- Disponible → Green
- Indisponible → Gray
- Retour aujourd'hui → Amber
- En retard → Red
- CASH → Amber outline

Badges should:
- Be small
- Be readable
- Never dominate the layout

---

### Cards
- Rounded corners (`rounded-lg`)
- Soft border
- Minimal or no shadow
- Emphasis on spacing, not decoration

---

### Tables
- Clear row separation
- Status always visible
- Actions aligned right
- Avoid horizontal scrolling

---

## 8. Iconography

- Library: **Lucide React**
- Stroke-based icons only
- No filled icons
- Icons must add clarity, not decoration

Common icons:
- AlertTriangle → Action requise
- Calendar → Réservations
- Wallet → Paiements
- Car → Véhicules
- Camera → Dégâts
- MessageCircle → WhatsApp

---

## 9. Copy & Microcopy Style

Tone:
- Professional
- Simple
- Direct
- Neutral French

Examples:

- ❌ "Oops, something went wrong"
- ✅ "Une action est requise"

- ❌ "Awesome!"
- ✅ "Opération effectuée"

---

## 10. Brand Promise (Internal Rule)

Every feature must answer:

> "Est-ce que cela aide l'agence à garder le contrôle ?"

If the answer is **no**, the feature does not belong in Locapro.

---

## 11. Design Tokens (Developer Reference)

Recommended tokens:

```css
--color-primary: #6D5EF7;
--color-danger: #DC2626;
--color-warning: #F59E0B;
--color-success: #16A34A;
--radius-default: 0.5rem;
--font-sans: Inter;
```
