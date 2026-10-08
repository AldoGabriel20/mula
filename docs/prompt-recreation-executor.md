# Execute the Backend–UI Alignment Plan

The previous task completed a backend audit and produced a UI-to-backend gap analysis and implementation plan.

Now move from **analysis/planning into implementation**.

## Objective

Update the existing backend and frontend integration so the current production code correctly supports the **finalized UI**.

The previous audit/implementation plan is now the primary execution blueprint.

Do NOT redo the entire audit from scratch unless you discover that the previous analysis is incorrect or incomplete.

Do NOT rebuild the backend.

Modify the existing code incrementally and preserve the current architecture, conventions, and working functionality.

---

# Step 1 — Read the Previous Audit

Before modifying code:

1. Find the audit / implementation plan produced in the previous task.
2. Read it completely.
3. Identify:

   * Existing endpoints that can be reused.
   * Existing endpoints that need modification.
   * New endpoints that are required.
   * Request/response contract changes.
   * Database changes.
   * Business logic changes.
   * Authorization/security changes.
   * Frontend integration changes.
   * Testing requirements.
4. Inspect the current source code related to those items.

Treat the previous audit as the implementation blueprint.

If the audit references a file, endpoint, table, or component that does not actually exist, investigate the repository before making assumptions.

---

# Step 2 — Create an Implementation Checklist

Before coding, convert the previous plan into a concrete checklist.

Group the work by domain, for example:

* Authentication
* Dashboard
* Invitations
* Templates
* Guests / RSVP
* Media
* Notifications
* Subscriptions / Payments
* User settings
* Other finalized UI functionality

For each item, identify:

```text
Task:
Current implementation:
Required change:
Files affected:
API affected:
Database affected:
Dependencies:
Acceptance criteria:
```

Prioritize work according to dependencies.

For example:

Database/model
→ Repository/data access
→ Service/business logic
→ API handler
→ API contract
→ Frontend integration
→ UI state handling
→ Tests

Do not randomly modify files across unrelated domains.

---

# Step 3 — Implement Existing Endpoint Changes First

For every existing endpoint marked as requiring modification:

1. Inspect the current implementation.
2. Preserve the existing endpoint unless there is a strong reason to change it.
3. Update request DTOs only when required.
4. Update response DTOs only when required.
5. Update service/business logic.
6. Update repository/query logic if required.
7. Update validation.
8. Update authorization/ownership checks.
9. Update frontend API integration.
10. Update tests.

Do not create a new endpoint when the existing endpoint can safely support the new UI requirement.

Pay particular attention to:

* Missing response fields.
* Incorrect response structure.
* Incorrect status values.
* Missing relationships.
* Missing pagination.
* Missing filtering/search.
* Incorrect sorting.
* Incorrect dashboard aggregation.
* Missing calculated fields.
* Incorrect ownership filtering.
* Missing validation.
* Outdated business logic from the old UI.

---

# Step 4 — Implement New Endpoints Only Where Necessary

For every item marked `MISSING ENDPOINT` in the audit:

Verify that the functionality cannot reasonably be handled by an existing endpoint.

If a new endpoint is genuinely required:

1. Define the endpoint contract.
2. Follow the project's existing REST/API conventions.
3. Implement request validation.
4. Implement authentication.
5. Implement authorization and ownership checks.
6. Implement business logic in the appropriate service/use-case layer.
7. Implement repository/database access.
8. Implement correct HTTP status codes.
9. Implement consistent error responses.
10. Add tests.
11. Integrate the endpoint into the frontend.

Do not create speculative endpoints for future functionality.

Only implement endpoints required by the current finalized UI or explicitly documented requirements.

---

# Step 5 — Update Database Only When Required

If the audit identifies a database gap:

* Inspect the existing schema first.
* Reuse existing tables and relationships whenever possible.
* Add only the required columns/tables/relationships.
* Create proper migrations.
* Preserve existing data.
* Add appropriate indexes and constraints.
* Consider transaction boundaries.
* Update models/entities and repositories.
* Update seeders/fixtures if the project uses them.

Never delete existing production data or perform destructive schema changes simply to make the new UI work.

If a database change could affect existing functionality, identify and handle the migration impact.

---

# Step 6 — Update Business Logic

The new UI may expose workflows that were not supported by the old backend.

Implement the required business behavior in the appropriate application/domain/service layer.

Examples:

* Invitation creation.
* Invitation editing.
* Invitation publishing/unpublishing.
* Template selection.
* Guest management.
* RSVP state changes.
* Dashboard calculations.
* Subscription state.
* Notification state.
* User settings.

Do not place complex business rules directly inside HTTP handlers.

Backend validation must remain authoritative even if the frontend already validates the same data.

---

# Step 7 — Update Authorization and Ownership

For every protected resource, verify:

```text
Authenticated?
        ↓
Authorized?
        ↓
Owns / has access to resource?
        ↓
Allowed operation?
```

Do not trust IDs or ownership information supplied by the frontend.

Specifically check for:

* IDOR.
* Cross-user access.
* Cross-user update/delete.
* Cross-user invitation access.
* Unauthorized publishing.
* Unauthorized dashboard data access.
* Unauthorized subscription/account access.

If the old backend has an authorization gap, fix it as part of this implementation.

---

# Step 8 — Connect the Finalized UI to the Updated Backend

Now update the frontend integration.

The finalized UI design must remain visually unchanged.

Only modify the functional/data layer where necessary.

Replace outdated assumptions from the old UI.

For every data-driven page:

* Connect the correct API.
* Use the correct request payload.
* Use the correct response structure.
* Handle loading state.
* Handle empty state.
* Handle validation errors.
* Handle unauthorized state.
* Handle not-found state.
* Handle server errors.
* Refresh/update UI state after mutations.

Remove obsolete mock data from flows that are now backed by real APIs.

However, do not remove intentional static/mock content that is part of the UI design and does not require backend persistence.

---

# Step 9 — Seeder / Development Data

If the finalized UI requires populated data for testing:

Create or update development seeders/fixtures where appropriate.

Seeder data should represent realistic scenarios such as:

* Multiple invitations.
* Different invitation statuses.
* Multiple templates.
* Guests.
* RSVP states.
* Dashboard statistics.
* Notifications.
* Subscription states.

Do not hardcode fake data directly into production frontend components just to make the UI look populated.

The goal is:

```text
Seeder
   ↓
Database
   ↓
Backend API
   ↓
Frontend
   ↓
Finalized UI
```

---

# Step 10 — Testing

For every implemented change:

### Backend

Test:

* Happy path.
* Invalid input.
* Missing input.
* Authentication failure.
* Authorization failure.
* Cross-user access.
* Resource not found.
* Business-rule violation.
* Database failure where relevant.

### API

Verify:

* HTTP method.
* Endpoint.
* Request body.
* Query parameters.
* Response structure.
* HTTP status.
* Error structure.

### Frontend

Verify:

* API request.
* Loading state.
* Success state.
* Empty state.
* Error state.
* Mutation result.
* Data refresh.

### Full flow

Verify critical flows end-to-end:

```text
User interaction
→ Frontend
→ API
→ Authentication
→ Authorization
→ Business logic
→ Database
→ API response
→ Frontend state
→ UI
```

Run the project's existing test suite, linting, type checking, and build commands where applicable.

Do not claim something passed unless it was actually executed.

---

# Step 11 — Visual Regression Protection

The finalized UI has already been approved.

Do NOT redesign it.

After backend integration, verify that the UI still matches the finalized implementation:

* Layout
* Typography
* Spacing
* Colors
* Gradients
* Cards
* Tables
* Charts
* Icons
* Images
* Buttons
* Modals
* Responsive behavior
* Loading states
* Empty states
* Error states

Functional integration must not unintentionally change the approved visual design.

---

# Step 12 — Regression Check

Before considering the implementation complete:

Check that existing functionality still works.

Especially verify:

* Existing authentication.
* Existing dashboard functionality.
* Existing invitation functionality.
* Existing API consumers.
* Existing database records.
* Existing authorization rules.

Do not remove existing endpoints merely because they are not used by the new UI.

---

# Important Rules

### DO

* Follow the previous audit.
* Reuse existing code.
* Reuse existing endpoints where appropriate.
* Make incremental changes.
* Preserve architecture.
* Preserve existing functionality.
* Add tests.
* Add migrations when required.
* Add seeders when useful for development.
* Keep the finalized UI unchanged.
* Report uncertainties explicitly.

### DO NOT

* Rebuild the backend from scratch.
* Rewrite the architecture unnecessarily.
* Create duplicate endpoints.
* Invent business requirements.
* Delete existing APIs without impact analysis.
* Delete production data.
* Hardcode fake API responses.
* Put business logic directly into handlers.
* Trust frontend ownership claims.
* Change the finalized UI unnecessarily.
* Implement unrelated features.

---

# Completion Criteria

The implementation is complete only when:

1. All actionable gaps from the previous audit have been addressed.
2. Existing APIs required by the UI work correctly.
3. Required new endpoints have been implemented.
4. Request/response contracts match the finalized UI.
5. Database changes are implemented safely.
6. Business logic is implemented correctly.
7. Authentication and authorization are enforced.
8. Frontend integration uses the updated API contracts.
9. Development seed data exists where required.
10. Relevant tests pass.
11. The application builds successfully.
12. No major regression is introduced.
13. The finalized UI remains visually consistent.

---

# Final Report

At the end, provide:

## Implemented

List each completed item.

## API Changes

```text
Modified:
- METHOD /endpoint
- Reason
- Change

Added:
- METHOD /endpoint
- Reason
```

## Database Changes

List migrations, schema changes, indexes, constraints, and seeders.

## Frontend Integration

List the pages/features connected to real backend functionality.

## Security

List authentication, authorization, ownership, and validation changes.

## Testing

List:

* Tests executed.
* Tests passed.
* Tests failed.
* Build result.
* Lint/type-check result.

## Remaining Issues

List anything still unresolved.

## Changed Files

List important files changed and their purpose.

## Final Status

Use one of:

* COMPLETE
* PARTIALLY COMPLETE
* BLOCKED

Do not mark the task COMPLETE if important gaps remain.
