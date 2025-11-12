# Design Guidelines: Rutas del Eje Cafetero

## Design Approach
**Reference-Based Tourism Design** inspired by Airbnb's card-based layouts and Booking.com's trust-building patterns, adapted for Colombian Coffee Region tourism with warm, organic aesthetics.

## Typography System
- **Primary Font**: Montserrat (Google Fonts) - clean, modern sans-serif
- **Secondary Font**: Merriweather (Google Fonts) - for body text warmth
- **Hierarchy**:
  - Hero Headlines: text-5xl md:text-6xl font-bold
  - Section Titles: text-3xl md:text-4xl font-semibold
  - Card Titles: text-xl font-semibold
  - Body: text-base leading-relaxed
  - Labels/Meta: text-sm font-medium

## Layout System
**Spacing Units**: Use Tailwind units 2, 4, 6, 8, 12, 16, 20, 24 consistently
- Section padding: py-16 md:py-24
- Card padding: p-6
- Element gaps: gap-6 or gap-8
- Container: max-w-7xl mx-auto px-4

## Page-Specific Layouts

### Home Page
**Hero Section** (80vh):
- Full-width background image of coffee plantations with mountains
- Centered content with blurred-background search card overlay
- Search includes: destination dropdown, date pickers, difficulty filter, CTA button
- Tagline: "Descubre la Magia del Café" - text-white with subtle shadow

**Featured Routes** (3-column grid on desktop, 1-column mobile):
- Large image cards with gradient overlay at bottom
- Route name, location, price, difficulty badge
- Hover lift effect (transform translate)

**Why Choose Us** (2-column layout):
- Left: Icon grid (4 icons: Expert Guides, Authentic Experiences, Safety First, Best Prices)
- Right: Supporting image of coffee farmer/guide

**Testimonials** (3-column cards):
- Avatar, name, rating stars, quote
- Subtle border, rounded corners

**CTA Section**:
- Full-width with coffee pattern background (opacity-10)
- Centered heading + description + primary button

### Routes Listing Page
**Filter Sidebar** (left, 25% width on desktop, drawer on mobile):
- Stacked filter groups: Destination checkboxes, Price range slider, Difficulty radio buttons, Duration select
- Sticky positioning (top-24)

**Routes Grid** (75% width, 2-column on desktop, 1-column mobile):
- Card format: Image (16:9 ratio), badge overlays (difficulty, duration), title, location icon + text, price, rating + reviews count, "Ver Detalles" button

### Route Detail Page
**Image Gallery** (3-image grid):
- Large main image (2/3 width), 2 smaller stacked (1/3 width)
- Click to open lightbox

**Content Layout** (2-column):
- Left (65%): Title, location, rating, description, itinerary accordion, included/not-included lists, map embed
- Right (35%): Sticky booking card with price, date picker, quantity selector, total, "Reservar Ahora" button, safety badges

### User Dashboard (Reservas)
**Status Tabs**: Upcoming, Past, Cancelled (horizontal tabs)
**Reservation Cards**: Timeline layout with image thumbnail, route name, dates, status badge, action buttons

### Admin Panel
**Navigation Sidebar**: Routes Management, Reservations, Users (vertical menu)
**Data Tables**: Sortable columns, search bar, pagination, action dropdowns

## Component Library

### Navbar
- Sticky top, backdrop-blur-sm, border-b
- Logo left, nav links center (desktop), profile/login right
- Mobile: Hamburger menu with slide-in drawer

### Cards (CardRuta)
- Rounded-xl overflow-hidden
- Image with aspect-ratio-16/9, object-cover
- Absolute positioned badges (top-right)
- Padding content area with flex column justify-between

### Buttons
- Primary: Solid with rounded-lg, px-6 py-3, font-medium, shadow-sm
- Secondary: Outlined variant
- On images: backdrop-blur-md bg-white/20 text-white

### Forms
- Input fields: border rounded-lg px-4 py-3, focus ring
- Labels: text-sm font-medium mb-2
- Error states: border-red with text-red message below
- Form sections: space-y-6

### Footer
- 4-column grid (desktop), stacked (mobile)
- Columns: About, Popular Routes, Quick Links, Contact
- Newsletter signup form
- Social icons row
- Bottom bar: Copyright, terms links

## Images Strategy
**Hero Images**: 
- Home: Wide coffee plantation landscape with mountains (1920x800)
- Routes: Specific route destination photos

**Route Cards**: High-quality photos of each route destination (600x400)

**About/Why Section**: Coffee farmers, traditional houses, coffee cherries close-up

**All images**: Use placeholder service initially with descriptive alt text indicating Coffee Region themes

## Interactions
- Card hover: Subtle lift (translateY(-4px)) with shadow increase
- Button hover: Slight darken/lighten
- Link hover: Underline animation
- Mobile: Touch-friendly 44px minimum tap targets
- No scroll hijacking, natural page flow

## Responsive Breakpoints
- Mobile: < 768px (single column, stacked layout)
- Tablet: 768px - 1024px (2-column grids)
- Desktop: > 1024px (full multi-column layouts)

## Accessibility
- ARIA labels on interactive elements
- Focus visible states with ring-2
- Semantic HTML5 structure
- Color contrast meeting WCAG AA
- Form labels properly associated

This design balances modern tourism UX patterns with Colombian Coffee Region authenticity, creating an inviting, trustworthy booking experience optimized for both desktop exploration and mobile booking.