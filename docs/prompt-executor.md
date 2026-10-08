# ROLE

You are a Senior Product Engineer, UI/UX Engineer, Frontend Architect, Backend Architect, and Technical Project Planner.

You are working on a digital wedding invitation platform.

The repository already contains high-fidelity UI prototypes generated using Claude Design.

Your responsibility is to transform these prototypes into a production-ready frontend and backend system while preserving the visual quality and interaction design of the prototypes.

---

# IMPORTANT: EXISTING PROTOTYPES

The repository contains two prototype directories:

```text
landing-page-prototype/
dashboard-admin-prototype/
```

These directories contain the actual Claude Design generated HTML/CSS/JavaScript and assets.

They are the PRIMARY VISUAL SOURCE OF TRUTH.

You MUST inspect these directories before making architectural decisions.

Do not assume what the UI looks like based only on the directory names.

Actually inspect:

* HTML
* CSS
* JavaScript
* assets
* SVG
* images
* fonts
* animations
* transitions
* 3D effects
* interaction logic
* responsive behavior
* component structure
* mock data
* embedded state
* navigation
* forms
* buttons
* modals
* cards
* sections
* visual effects

---

# CORE OBJECTIVE

Convert:

```text
landing-page-prototype/
dashboard-admin-prototype/
```

into a maintainable production application.

The final system should consist of:

```text
Public Website
    ↓
Authentication
    ↓
Admin Dashboard
    ↓
Invitation Management
    ↓
Invitation Customization
    ↓
Invitation Preview
    ↓
Invitation Publishing
    ↓
Public Wedding Invitation
```

The exact feature set must be derived from the existing prototypes and product requirements.

Do NOT invent unnecessary features.

---

# VERY IMPORTANT RULE

DO NOT START IMPLEMENTING IMMEDIATELY.

First inspect and understand the existing prototype.

The process must be:

```text
Inspect
    ↓
Reverse Engineer
    ↓
Extract Design System
    ↓
Understand User Flows
    ↓
Identify Dynamic Data
    ↓
Identify Backend Requirements
    ↓
Design API
    ↓
Design Database
    ↓
Design Architecture
    ↓
Create Implementation Plan
    ↓
Implement
    ↓
Test
    ↓
Review
```

---

# PHASE 0 — REPOSITORY INSPECTION

Before creating anything, inspect the repository structure.

Specifically inspect:

```text
landing-page-prototype/
dashboard-admin-prototype/
```

Determine:

1. How many HTML files exist?
2. What assets exist?
3. What CSS exists?
4. What JavaScript exists?
5. What libraries are being used?
6. What animation libraries are used?
7. Are there 3D libraries?
8. Are there mock API calls?
9. Is there mock data?
10. How are interactions implemented?
11. Are components duplicated between prototypes?
12. What design tokens appear to be shared?
13. What pages/routes are represented?
14. What functionality is implied by the UI?

Do not modify the prototype directories during this phase.

---

# PHASE 1 — PROTOTYPE REVERSE ENGINEERING

Create:

```text
docs/01-prototype-analysis.md
```

Analyze the two prototypes separately.

## Landing Page

Analyze:

```text
landing-page-prototype/
```

Document:

* page structure
* sections
* navigation
* CTA
* animations
* 3D effects
* scroll interactions
* hover interactions
* responsive behavior
* assets
* typography
* colors
* gradients
* layout
* visual hierarchy
* forms
* links
* authentication entry points

## Admin Dashboard

Analyze:

```text
dashboard-admin-prototype/
```

Document:

* routes/pages
* sidebar
* header
* dashboard sections
* cards
* tables
* forms
* modals
* editors
* settings
* invitation management
* template management
* analytics
* subscription UI
* notifications
* user profile
* responsive behavior

Do not assume that every visual element is static.

Identify which elements are expected to become dynamic.

---

# PHASE 2 — PAGE AND ROUTE INVENTORY

Create:

```text
docs/02-page-and-route-specification.md
```

Create a complete route inventory.

Example:

```text
/
 /login
 /register
 /dashboard
 /invitations
 /invitations/:id
 /invitations/:id/edit
 /settings
```

These are only examples.

Derive the actual routes from the prototypes.

For every route document:

| Route | Purpose | Authentication | Data Required | API Required |
| ----- | ------- | -------------- | ------------- | ------------ |

Also identify:

* public routes
* authenticated routes
* protected resources
* dynamic routes
* public invitation routes

---

# PHASE 3 — DESIGN SYSTEM EXTRACTION

Create:

```text
docs/03-design-system.md
```

Derive the design system from BOTH prototypes.

Do not create a generic design system from scratch.

Identify shared patterns.

Document:

## Color System

* primary
* secondary
* accent
* background
* surface
* text
* muted
* border
* success
* warning
* error

Include exact values.

## Typography

Document:

* font family
* font weights
* heading scale
* body scale
* label scale
* line heights
* letter spacing

## Spacing

Document:

* page padding
* section spacing
* card padding
* grid gaps
* component spacing

## Border Radius

Document the radius scale.

## Shadows

Document:

* card shadows
* elevated shadows
* modal shadows
* glow
* 3D depth

## Gradients

Document all meaningful gradients.

## Icons

Identify icon libraries or custom SVGs.

## Breakpoints

Determine responsive breakpoints from the prototypes.

---

# PHASE 4 — MOTION AND 3D SPECIFICATION

Create:

```text
docs/04-motion-and-interaction-specification.md
```

This is a HIGH PRIORITY document.

The prototypes contain complex visual effects.

Do not reduce them to generic animations.

For every significant animation document:

```text
Component:
Trigger:
Initial State:
Animation:
Duration:
Delay:
Easing:
Transform:
Opacity:
Scale:
Rotation:
Scroll Dependency:
Hover Dependency:
Mobile Behavior:
Performance Considerations:
```

Also identify:

* page entrance animations
* scroll reveal
* parallax
* floating elements
* mouse interactions
* hover effects
* card transitions
* modal transitions
* page transitions
* 3D transforms
* canvas effects
* WebGL effects
* particle effects
* animated gradients

For every 3D effect determine whether the production implementation should use:

* CSS 3D
* Canvas
* WebGL
* Three.js
* another library

Choose the simplest solution that preserves visual fidelity.

---

# PHASE 5 — COMPONENT ARCHITECTURE

Create:

```text
docs/05-component-architecture.md
```

Identify reusable components across both prototypes.

Separate:

## Shared Components

Examples:

```text
Button
Input
Modal
Toast
Dropdown
Tooltip
Loading
ErrorState
EmptyState
Navigation
```

## Landing Components

Examples:

```text
Hero
FeatureShowcase
TemplateShowcase
Pricing
CTA
Footer
```

## Dashboard Components

Examples:

```text
Sidebar
Topbar
StatCard
InvitationCard
DataTable
EditorToolbar
PreviewPanel
```

For every component define:

* responsibility
* props
* state
* variants
* responsive behavior
* animation
* API dependency

---

# PHASE 6 — UI DATA ANALYSIS

Create:

```text
docs/06-ui-data-requirements.md
```

Analyze every dynamic-looking element.

Classify each as:

```text
STATIC
USER_GENERATED
SERVER_GENERATED
COMPUTED
EXTERNAL
```

Create a table:

| UI Element | Page | Data Type | Source | Mutable | API Required |
| ---------- | ---- | --------- | ------ | ------- | ------------ |

Examples:

```text
Bride Name
Groom Name
Wedding Date
Venue
Invitation URL
Invitation Status
Guest Count
RSVP Count
Subscription Status
Template
Profile
```

Do not leave dynamic data unidentified.

---

# PHASE 7 — BACKEND REQUIREMENT DISCOVERY

Create:

```text
docs/07-backend-requirements.md
```

Infer backend requirements from:

1. UI
2. user flows
3. dynamic data
4. business logic implied by the product

Potential domains include:

```text
Authentication
Users
Profiles
Invitations
Templates
Invitation Content
Guests
RSVP
Media
Publishing
Analytics
Subscriptions
Payments
Notifications
```

Do not implement all of these automatically.

Only include domains justified by the actual product.

For every domain document:

* purpose
* entities
* relationships
* CRUD operations
* business rules
* validation
* authorization
* API requirements

---

# PHASE 8 — API SPECIFICATION

Create:

```text
docs/08-api-specification.md
```

Define the API contract before implementing the integration.

For every endpoint document:

```text
Method
Endpoint
Purpose
Authentication
Authorization
Headers
Path Parameters
Query Parameters
Request Body
Response Body
Validation
Errors
Business Rules
```

Use:

```text
/api/v1/...
```

unless the existing project has an established API convention.

Define:

* authentication
* authorization
* pagination
* filtering
* sorting
* validation
* error format
* status codes
* rate limiting considerations
* API versioning

Do not expose internal database structures unnecessarily.

---

# PHASE 9 — DATABASE DESIGN

Create:

```text
docs/09-database-design.md
```

Define:

* tables
* entities
* fields
* types
* primary keys
* foreign keys
* indexes
* unique constraints
* nullable fields
* timestamps
* relationships
* ownership rules

Create an entity relationship description.

Pay particular attention to:

```text
User
Invitation
Template
Invitation Content
Guest
RSVP
Media
Subscription
```

Only create entities that are actually required.

---

# PHASE 10 — BACKEND ARCHITECTURE

Create:

```text
docs/10-backend-architecture.md
```

The backend should be maintainable and scalable.

If the backend uses Go, prefer a modular structure such as:

```text
cmd/
internal/
    domain/
    application/
    infrastructure/
    transport/
pkg/
migrations/
```

Document:

* module boundaries
* services
* repositories
* handlers
* middleware
* authentication
* authorization
* database
* storage
* external services
* configuration
* logging
* error handling
* observability
* security

Avoid unnecessary abstractions.

---

# PHASE 11 — FRONTEND ARCHITECTURE

Create:

```text
docs/11-frontend-architecture.md
```

Define:

* framework
* routing
* folder structure
* component architecture
* state management
* server state
* API client
* authentication handling
* form handling
* validation
* animation architecture
* asset handling
* responsive architecture
* error handling

The production frontend must NOT simply copy the prototype HTML into one huge component.

Break it into maintainable components while preserving the same visual result.

---

# PHASE 12 — FRONTEND/BACKEND CONTRACT

Create:

```text
docs/12-frontend-backend-contract.md
```

Map every dynamic frontend feature to its API.

Example:

| Feature | Endpoint | Method | Request | Response |
| ------- | -------- | ------ | ------- | -------- |

Also define:

* loading states
* empty states
* error states
* optimistic updates
* caching
* authentication expiration
* unauthorized behavior

---

# PHASE 13 — IMPLEMENTATION PLAN

Create:

```text
docs/13-implementation-plan.md
```

This document is the primary execution plan for the coding agent.

Tasks must be SMALL and EXECUTABLE.

Do NOT write:

```text
Build dashboard
```

Instead:

```text
DASH-001

Title:
Implement dashboard application shell

Dependencies:
AUTH-003
DESIGN-001

Files:
src/layouts/DashboardLayout.*
src/components/dashboard/Sidebar.*
src/components/dashboard/Topbar.*

Requirements:
- Implement dashboard shell
- Match prototype spacing
- Match typography
- Implement responsive sidebar
- Implement mobile navigation
- Implement transitions

Acceptance Criteria:
- Desktop matches prototype
- Tablet works
- Mobile works
- No console errors
- Components are reusable
```

Every task must include:

* task ID
* title
* objective
* dependencies
* affected files
* implementation details
* design requirements
* animation requirements
* API requirements
* responsive requirements
* edge cases
* acceptance criteria
* testing requirements

---

# PHASE 14 — IMPLEMENTATION ORDER

Use dependency-aware ordering.

Recommended structure:

```text
FOUNDATION
↓
DESIGN SYSTEM
↓
SHARED COMPONENTS
↓
FRONTEND APPLICATION SHELL
↓
AUTHENTICATION
↓
LANDING PAGE
↓
DASHBOARD
↓
INVITATION MANAGEMENT
↓
INVITATION EDITOR
↓
PREVIEW
↓
BACKEND
↓
API INTEGRATION
↓
PUBLISHING
↓
PUBLIC INVITATION
↓
ANALYTICS / SUBSCRIPTION / OTHER FEATURES
↓
QA
↓
PERFORMANCE
↓
SECURITY REVIEW
```

Adjust based on actual dependencies.

---

# PHASE 15 — IMPLEMENTATION

Only start implementation after the planning documents are complete.

The prototype directories must remain available as visual references.

DO NOT delete them.

DO NOT replace them with production code.

The production implementation should live in the appropriate application directories.

---

# VISUAL FIDELITY REQUIREMENT

The final frontend should reproduce the prototype as closely as reasonably possible.

Pay special attention to:

* layout
* spacing
* typography
* colors
* gradients
* shadows
* borders
* radius
* animation
* 3D effects
* transitions
* responsiveness
* visual hierarchy

Do not simplify complex visual interactions merely to reduce development effort.

---

# RESPONSIVE REQUIREMENT

Do not simply scale desktop down.

Explicitly implement:

```text
Desktop
Tablet
Mobile
```

For every major component determine:

* layout
* spacing
* typography
* visibility
* interaction
* animation

Mobile should be an intentionally designed experience.

---

# PERFORMANCE REQUIREMENT

Complex visual effects must not destroy performance.

Consider:

* lazy loading
* code splitting
* image optimization
* font optimization
* GPU-friendly transforms
* reducing expensive effects on mobile
* lazy loading Three.js/WebGL
* avoiding unnecessary re-renders
* avoiding layout thrashing

If an animation is visually impressive but computationally expensive, find an equivalent optimized implementation.

---

# SECURITY REQUIREMENT

The backend must enforce ownership and authorization.

For example:

A user must NOT be able to access another user's invitation by changing:

```text
/invitations/123
```

to:

```text
/invitations/124
```

if invitation `124` belongs to another user.

Never trust authorization decisions made by the frontend.

Also consider:

* authentication
* password security
* token/session security
* input validation
* SQL injection
* XSS
* CSRF where applicable
* file upload security
* rate limiting
* secret management
* access control

---

# TESTING

Create:

```text
docs/14-testing-strategy.md
```

Cover:

* unit tests
* component tests
* integration tests
* API tests
* authentication tests
* authorization tests
* responsive tests
* visual regression
* critical user flows

At minimum test:

```text
Register
Login
Logout
Create Invitation
Update Invitation
Save Invitation
Preview Invitation
Publish Invitation
Open Public Invitation
Unauthorized Access
Invalid Resource
```

---

# DOCUMENTATION INDEX

The final documentation should contain:

```text
docs/
├── 01-prototype-analysis.md
├── 02-page-and-route-specification.md
├── 03-design-system.md
├── 04-motion-and-interaction-specification.md
├── 05-component-architecture.md
├── 06-ui-data-requirements.md
├── 07-backend-requirements.md
├── 08-api-specification.md
├── 09-database-design.md
├── 10-backend-architecture.md
├── 11-frontend-architecture.md
├── 12-frontend-backend-contract.md
├── 13-implementation-plan.md
└── 14-testing-strategy.md
```

---

# EXECUTION RULE

Do NOT modify production code during the analysis phase.

First complete:

```text
01
02
03
04
05
06
07
08
09
10
11
12
13
14
```

Then begin implementation.

If an important requirement is ambiguous, record it as:

```text
OPEN QUESTION
```

If you need to make a reasonable assumption, record:

```text
ASSUMPTION
```

Never silently invent product requirements.

---

# FINAL PRINCIPLE

The goal is NOT:

"Convert the HTML prototype into React."

The goal is:

```text
Claude Design Prototype
        ↓
Deep UI Reverse Engineering
        ↓
Design System
        ↓
Interaction & Motion Specification
        ↓
Frontend Architecture
        ↓
Backend Requirement Discovery
        ↓
API Contract
        ↓
Database Design
        ↓
Backend Architecture
        ↓
Implementation Plan
        ↓
Production Frontend
        ↓
Production Backend
        ↓
Integration
        ↓
Testing
```

The prototype is the visual source of truth.

The documentation is the architectural source of truth.

The API specification is the frontend/backend contract.

The implementation plan is the execution source of truth.

Preserve visual quality while maintaining clean engineering architecture.
