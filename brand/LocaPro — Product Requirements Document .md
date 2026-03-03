LocaPro — Product Requirements Document (PRD)
Landing Page & Web Application

1. Product Overview
Product Name: LocaPro
Tagline: Votre agence, sous contrôle.
Live URL: https://car-rental-sass.vercel.app/
Target Market: Moroccan car rental agencies (independent operators and small-to-mid fleets)
Languages: French (primary), Arabic (secondary), English (tertiary)
Tech Stack: Next.js 15, React Server Components, TypeScript, Tailwind CSS, shadcn/ui, Prisma, PostgreSQL
Design Inspiration: Slack.com — specifically its use of a rich purple/violet gradient background with scattered decorative elements (dots, sparkles, stars), generous whitespace, rounded UI previews floating with subtle shadows, bold but clean typography, alternating section backgrounds (white, light gray, deep purple), and feature sections that pair concise copy on one side with polished product screenshots on the other.

2. Design System & Visual Language
2.1 Color Palette
Derived from the existing LocaPro brand (overlapping ellipses in amber and blue-violet gradients), but expanded to match the Slack-inspired aesthetic:
RoleColorUsagePrimary Deep#3B1578Hero backgrounds, deep sections, navPrimary Vibrant#6C3FC5Buttons, accents, interactive elementsPrimary Light#9B7FE6Hover states, secondary accentsAccent Amber#F5A623CTAs, highlights, badges, attention pointsAccent Warm#FF8C42Secondary CTAs, gradient endpointsSurface White#FFFFFFCard backgrounds, content areasSurface Light#F8F6FFAlternating section backgroundsSurface Muted#F0ECF9Input fields, subtle containersText Primary#1A1136Headings, body textText Secondary#6B6584Descriptions, captionsSuccess#22C55EAvailable status, positive metricsWarning#EAB308Maintenance, approaching deadlinesDanger#EF4444Overdue, critical alerts
2.2 Background Treatment (Slack-Inspired)
The hero and select deep sections use a rich gradient background (#3B1578 → #6C3FC5 → #4A1D96) with:

Scattered decorative elements: Small dots, sparkle/star shapes, and subtle circular glows distributed randomly across the background, rendered as absolutely-positioned SVGs or CSS pseudo-elements. These should feel playful but not distracting — like the floating particles on Slack's hero.
Soft radial glows: Two or three large, low-opacity radial gradients (in amber and violet) creating depth, placed behind the main content.
Noise texture overlay: A very subtle grain texture at 2-3% opacity to add warmth and prevent the gradients from feeling flat.

Alternating sections use white (#FFFFFF) and light violet (#F8F6FF) to create visual rhythm, exactly as Slack alternates between purple and white sections.
2.3 Typography
ElementFontWeightSize (desktop)H1 (Hero)Inter800 (ExtraBold)56-64pxH2 (Section)Inter700 (Bold)40-48pxH3 (Feature)Inter600 (SemiBold)24-28pxBodyInter400 (Regular)16-18pxCaption/SmallInter40014pxData/MetricsJetBrains Mono70048-56px
Key typographic rules: Section headings should have a slight letter-spacing tightening (-0.02em). Hero text can use a subtle text gradient (white to light violet) for premium feel. Metric numbers (like "97 mins" on Slack) use the monospace font at large scale for impact.
2.4 Component Styling

Cards: 16-20px border-radius, subtle shadow (0 4px 24px rgba(59, 21, 120, 0.08)), white background. On hover, shadow deepens and card lifts 2px with a smooth 200ms transition.
Buttons: Primary buttons use an amber-to-warm-orange gradient with white text, 12px border-radius, medium padding (12px 28px). Secondary buttons are outlined in violet. All buttons have a subtle scale(1.02) on hover.
Product Screenshots: Displayed in rounded containers (16px radius) with a layered shadow effect. Screenshots should be slightly rotated (1-2°) or overlapping for dynamism, similar to how Slack shows its UI floating above the hero gradient.
Section Dividers: No hard lines. Sections transition via background color change and generous spacing (120-160px vertical padding).

2.5 Spacing & Layout

Max content width: 1200px, centered
Section vertical padding: 120px top, 120px bottom (minimum)
Feature sections use a two-column layout: copy (left, ~45%) and screenshot/visual (right, ~55%), alternating sides per section
Mobile: Single column, stack copy above visual
Generous line-height on body text: 1.7


3. Landing Page Structure & Copy
3.1 Navigation Bar
Fixed top nav, transparent over hero gradient, transitioning to white with shadow on scroll.
Left: LocaPro logo (the overlapping ellipses mark + wordmark)
Center: Links — Fonctionnalités, Tarifs, Témoignages, Contact
Right: "Se connecter" (ghost button) + "Essai gratuit" (amber CTA button)
On mobile: hamburger menu with a slide-in drawer.

3.2 Hero Section
Background: Deep purple gradient with decorative sparkles, dots, and soft radial glows (as described in 2.2).
Layout: Centered text above a floating product screenshot.
Eyebrow text (small, uppercase, letter-spaced, amber color):
"GESTION LOCATIVE INTELLIGENTE"
Headline (H1, white, bold):
"Votre flotte. Vos clients. Vos finances. Un seul tableau de bord."
Subheadline (Body, white at 80% opacity, max-width 600px centered):
"LocaPro donne aux agences de location de voitures au Maroc un outil moderne pour gérer les réservations, suivre les véhicules, et garder le contrôle total — sans Excel, sans papier, sans stress."
CTA Row:

Primary: "Démarrer gratuitement" (amber gradient button, large)
Secondary: "Voir la démo" (white outlined button with play icon)

Trust bar (below CTAs, small logos or text):
"Fait pour les agences marocaines 🇲🇦 · WhatsApp intégré · Français & Arabe"
Product Screenshot:
A large, rounded screenshot of the LocaPro dashboard floating below the text, angled very slightly (1°), with layered shadows creating a sense of depth. Optionally show a second smaller screenshot (the calendar view) peeking from behind at a different angle, creating a stacked card effect like Slack's hero.
Below the screenshot, three small pill-shaped feature tags, centered:
"📊 Tableau de bord en temps réel" · "📅 Calendrier de planning" · "💰 Centre financier"

3.3 Social Proof Bar
Background: White
Layout: A horizontal scrolling row of agency logos or a text-based stat bar.
If logos aren't available yet, use three stats in large monospace numbers:

500+ réservations gérées chaque mois
50+ agences font confiance à LocaPro
99.9% disponibilité de la plateforme

Small text below: "Rejoignez les agences qui ont abandonné Excel."

3.4 Feature Section 1 — Fleet Management
Background: Light violet (#F8F6FF)
Layout: Copy left, screenshot right
Eyebrow: "GESTION DE FLOTTE"
Heading (H2): "Chaque véhicule, toujours sous contrôle."
Body copy:
"Ajoutez vos véhicules en quelques clics. Suivez leur statut en temps réel — disponible, en location, en maintenance, ou indisponible. Filtrez, cherchez, et accédez aux détails de chaque voiture instantanément. LocaPro vous rappelle automatiquement les échéances : vidange, assurance, visite technique, vignette."
Feature bullets (3 items, each with a small amber icon):

🚗 Fiche véhicule complète avec photos et documents
🔔 Rappels automatiques de maintenance et conformité
📊 Statuts visuels pour une vue d'ensemble instantanée

Screenshot: The vehicle list/detail page with status badges visible.

3.5 Feature Section 2 — Reservations
Background: White
Layout: Screenshot left, copy right
Eyebrow: "RÉSERVATIONS"
Heading: "De la demande au retour, tout est fluide."
Body:
"Créez une réservation en moins de 2 minutes. Le calcul automatique gère les tarifs, suppléments, remises, taxes et caution. Suivez les paiements partiels, repérez les retours en retard, et ne laissez plus aucune facture impayée passer entre les mailles du filet."
Feature bullets:

⚡ Workflow de réservation guidé et rapide
💳 Calcul automatique : tarifs, taxes, caution, remises
🚨 Alertes retours en retard et impayés

Screenshot: The reservation creation/detail screen.

3.6 Feature Section 3 — Planning & Availability
Background: Deep purple gradient (with decorative elements, like a second hero-style break)
Layout: Centered text above a wide screenshot
Heading (white): "Voyez votre planning comme jamais."
Body (white, 80% opacity):
"Deux vues puissantes : un catalogue filtrable par dates pour trouver les véhicules disponibles, et un calendrier hebdomadaire interactif avec timeline de réservations, filtres par statut, et modification directe depuis la vue."
Screenshot: Full-width calendar view, floating with shadow, rounded corners. This is the visual centerpiece — make it large and impressive.
Stat callout (large monospace number, amber):
"97 min → 12 min"
"Temps moyen de planification hebdomadaire réduit."

3.7 Feature Section 4 — Operations Dashboard
Background: White
Layout: Copy left, screenshot right
Eyebrow: "TABLEAU DE BORD"
Heading: "Chaque matin, prenez le contrôle en 30 secondes."
Body:
"Votre tableau de bord affiche tout ce qui compte : cash net, montants à encaisser, taux d'occupation, retours en retard, cautions à libérer, et exposition au risque. Le centre d'action vous montre les tâches urgentes — plus besoin de chercher les problèmes, ils viennent à vous."
Feature bullets:

📈 KPIs en temps réel : cash, occupation, risque
⏰ Retours en retard et cautions en attente
🎯 Centre d'action pour les tâches urgentes

Metric callout (large number):
"35%" — "Réduction du temps passé sur les tâches administratives."

3.8 Feature Section 5 — Customer Management
Background: Light violet
Layout: Screenshot left, copy right
Eyebrow: "GESTION CLIENTS"
Heading: "Connaissez vos clients. Vraiment."
Body:
"Chaque client a une fiche complète : documents (CIN, passeport, permis), historique de réservations, solde et montant total dépensé. Filtrez votre base, exportez en CSV, et identifiez vos meilleurs clients en un coup d'œil."
Feature bullets:

📁 Documents scannés et stockés en sécurité
📜 Historique complet par client
📤 Export CSV pour vos rapports


3.9 Feature Section 6 — Finance Center & Cash Register
Background: White
Layout: Copy left, screenshot right
Eyebrow: "FINANCES"
Heading: "Vos finances, sans zone d'ombre."
Body:
"Deux modules financiers complémentaires. Le Centre Financier vous donne une vue d'ensemble : cash en main, impayés, cautions détenues, bénéfice net, revenus vs dépenses, rentabilité par véhicule, et alertes financières. La Caisse suit les mouvements quotidiens et mensuels — entrées, sorties, solde courant, et saisie manuelle de dépenses."
Feature bullets:

💰 Cash en main, impayés, et bénéfice net en un clin d'œil
🚘 Rentabilité par véhicule
📒 Caisse avec historique des mouvements

Screenshot: Finance dashboard showing charts and metrics.

3.10 Feature Section 7 — Inspections & Damage Reports
Background: Light violet
Layout: Screenshot left, copy right
Eyebrow: "INSPECTIONS"
Heading: "État des lieux : pro et sans litige."
Body:
"Un assistant en 4 étapes pour les inspections de départ et de retour. Photographiez les dommages, estimez les coûts, et décidez en un clic : libérer la caution, la retenir partiellement, ou la bloquer entièrement. Vos inspections deviennent des preuves, pas des approximations."
Feature bullets:

📸 Photos de dommages intégrées
🧮 Estimation automatique des coûts
🔒 Décision de caution en un clic


3.11 Feature Section 8 — Traffic Infractions
Background: White
Layout: Copy left, visual right
Eyebrow: "INFRACTIONS"
Heading: "Les PV ne disparaissent plus."
Body:
"Enregistrez chaque infraction routière, liez-la au véhicule, à la réservation et au client concerné. Assignez la responsabilité, suivez le statut (payée, contestée, en cours), et retrouvez n'importe quelle infraction grâce aux filtres avancés."

3.12 Feature Section 9 — WhatsApp Integration
Background: Deep purple gradient (third and final dark section)
Layout: Centered text with phone mockup visual
Heading (white): "WhatsApp intégré. Parce que c'est comme ça qu'on travaille au Maroc."
Body (white):
"Envoyez des confirmations de réservation, partagez votre catalogue de véhicules disponibles, et communiquez avec vos clients — tout ça directement depuis LocaPro via WhatsApp. Pas de copier-coller, pas de va-et-vient."
Visual: A phone mockup showing a WhatsApp conversation with a LocaPro booking confirmation message.

3.13 Pricing Section
Background: White
Layout: 2-3 pricing cards, centered
Heading: "Un prix simple. Pas de surprises."
Subheading: "Commencez gratuitement. Passez au Pro quand vous êtes prêt."
Cards:
PlanPrixContenuStarter (Gratuit)0 MAD/moisJusqu'à 5 véhicules, réservations illimitées, tableau de bord de basePro499 MAD/moisVéhicules illimités, centre financier, inspections, WhatsApp, support prioritaireAgence+899 MAD/moisMulti-utilisateurs, multi-agences, API, formations personnalisées, SLA garanti
Each card has a CTA: "Commencer" (amber for Pro, outlined for others).

3.14 Testimonials
Background: Light violet
Layout: 3 cards in a row, each with a quote, name, agency name, and small avatar circle.
Heading: "Ils gèrent leur agence avec LocaPro."
Placeholder testimonials (to be replaced with real ones):

"Avant LocaPro, je passais 2 heures par jour sur Excel. Maintenant, c'est 15 minutes."
— Mehdi R., Atlas Car Rental, Marrakech


"Le calendrier de planning a changé notre façon de travailler. On ne double-book plus jamais."
— Fatima Z., Sahara Wheels, Agadir


"Le module d'inspection nous a évité 3 litiges en un mois."
— Karim B., CasaCar, Casablanca


3.15 Final CTA Section
Background: Deep purple gradient with sparkles (mirrors the hero)
Layout: Centered
Heading (white): "Prêt à reprendre le contrôle ?"
Body (white): "Essayez LocaPro gratuitement. Aucune carte bancaire requise. Configuration en 5 minutes."
CTA: "Démarrer maintenant" (large amber button)
Secondary: "Contactez-nous pour une démo" (white text link)

3.16 Footer
Background: Very dark purple (#1A0D3B)
Columns: Produit (features links), Ressources (aide, blog, API docs), Entreprise (à propos, contact, CGU), Langue (FR / AR / EN toggle)
Bottom row: "© 2025 LocaPro · Fait avec ❤️ au Maroc" + social icons

4. Application Architecture (Summary)
4.1 Core Modules
ModuleRoute GroupDescriptionDashboard/dashboardKPIs, alerts, action center, quick statsFleet/fleetVehicle CRUD, status management, documents, remindersReservations/reservationsBooking workflow, pricing engine, payment trackingPlanning/planningCalendar view (React Big Calendar), availability catalogueCustomers/customersClient CRM, documents, history, balancesFinance/financeRevenue, expenses, profit, vehicle profitabilityCash Register/caisseDaily movements, running balance, manual entriesInspections/inspections4-step wizard, photos, damage reports, deposit decisionsMaintenance/maintenanceReminders: oil, insurance, inspection, vignetteInfractions/infractionsTraffic violation records, responsibility, status trackingSettings/settingsAgency profile, users, billing, preferences
4.2 Data Model Highlights
Key entities: Agency, User, Vehicle, Customer, Reservation, Payment, Inspection, DamageReport, MaintenanceReminder, Infraction, CashMovement, Document.
Multi-tenancy via agencyId foreign key on all tenant-scoped tables. Row-level security enforced at the Prisma middleware level.
4.3 Key Technical Decisions

Server Components by default — client components only where interactivity demands it (calendar, forms, modals)
Prisma + PostgreSQL — staying with the current stack for stability and migration simplicity
shadcn/ui — consistent component library matching the design system
React Big Calendar — for the weekly planning view, customized with LocaPro brand colors and booking status indicators
File uploads — vehicle photos, customer documents, and inspection photos stored via cloud storage (Cloudflare R2 or equivalent)
WhatsApp integration — via WhatsApp Business API or wa.me deep links for MVP, graduating to full API for automated messages


5. Interaction & Animation Guidelines
5.1 Page Load

Hero text fades in and slides up (200ms delay between headline and subheadline)
Product screenshots fade in and float up from below (400ms after text)
Decorative sparkles/dots animate in with a staggered scale-up effect
Trust bar fades in last

5.2 Scroll Animations

Each feature section triggers on scroll-into-view (IntersectionObserver, threshold 0.2)
Copy side: fade-in + slide from left/right (depending on layout side), 500ms, ease-out
Screenshot side: fade-in + slight upward float, 600ms, ease-out, 100ms delay after copy
Metric callouts: number counts up from 0 to target value over 1.5s (use a count-up library or requestAnimationFrame)

5.3 Micro-interactions

Buttons: scale(1.02) on hover, subtle shadow increase, 150ms transition
Cards: lift + shadow deepen on hover, 200ms
Nav links: underline slides in from left on hover
Pricing cards: the "Pro" card is slightly larger and elevated by default, with a "Populaire" badge


6. Responsive Breakpoints
BreakpointWidthLayout ChangesDesktop≥1024pxTwo-column feature sections, 3-column pricingTablet768-1023pxFeature sections stack, 2-column pricing, reduced paddingMobile<768pxSingle column throughout, hamburger nav, full-width CTAs, stacked pricing cards

7. SEO & Performance Requirements

Lighthouse target: 90+ across all categories
Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
Meta tags: French-language meta descriptions, OpenGraph tags with product screenshot, Twitter cards
Structured data: SoftwareApplication schema for Google
Image optimization: Next.js Image component, WebP format, lazy loading below the fold
Font loading: Inter via next/font/google with display: swap


8. Analytics & Conversion Tracking

Events to track: Hero CTA clicks, pricing plan selections, demo requests, scroll depth per section, feature section visibility (which features get seen most), WhatsApp integration clicks
Tools: Vercel Analytics (built-in) + Google Analytics 4 or Plausible for privacy-friendly option
A/B testing considerations: Hero headline variants, CTA button color (amber vs green), pricing display (monthly vs annual toggle)


9. Launch Checklist

Landing page live with all sections, responsive, and animated
Pricing integrated with payment processor (CMI or Stripe for Morocco)
Onboarding flow: sign up → create agency → add first vehicle → create first reservation
WhatsApp deep links functional in booking flow
French and Arabic language toggle operational
Customer testimonials (real) collected from beta users
Help center / FAQ page with common questions
Legal pages: CGU, politique de confidentialité, mentions légales