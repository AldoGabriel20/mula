# Task: Align Existing Backend with the Latest UI and Implement Missing APIs

## 1. Role

Act as a Senior Full-Stack Engineer, Backend Architect, API Designer, Database Engineer, and QA Engineer.

Your responsibility is to align the existing backend with the latest approved frontend UI. The backend has already been implemented, but some of its APIs, response structures, business logic, and data models may still reflect an older version of the UI.

Your job is to audit the entire integration, identify discrepancies, and implement the necessary backend and frontend API integration changes so that the latest UI works correctly from end to end.

**This is an existing-system evolution task, not a greenfield rewrite.**

Prioritize correctness, backward compatibility where needed, security, maintainability, and minimal unnecessary changes.

## 2. Source of Truth and Priority

Use the following sources in this order:

1. **Latest approved frontend UI** — source of truth for the current user experience, visible features, page structure, user actions, forms, filters, tables, dashboards, modals, and workflows.
2. **Existing backend implementation** — source of truth for currently implemented business logic, services, database access, authentication, authorization, and integrations that should be preserved where appropriate.
3. **Existing API specifications and project documentation** — source of truth for established contracts, architecture, business rules, and technical constraints, unless they are demonstrably outdated or conflict with approved requirements.
4. **Existing database schema and migrations** — source of truth for persisted data and relationships, subject to documented changes required by the latest product behavior.

Do not assume the latest UI is already correctly connected to the backend.

Do not assume every existing endpoint is still required.

Do not assume every visible UI feature requires a new endpoint.

Inspect the actual repository before making decisions.

## 3. Phase 1 — Audit the Existing System

Before changing code, inspect the project structure and identify:

* Frontend framework, routing, pages, shared components, and API client.
* Backend framework, application entry points, routing, middleware, handlers/controllers, services, repositories, and models.
* Existing API endpoints, HTTP methods, request parameters, request bodies, response structures, and error formats.
* Authentication, authorization, session/token management, and resource ownership checks.
* Database schema, relationships, migrations, indexes, constraints, and seeders.
* Existing tests, API documentation, environment configuration, and external integrations.
* Existing frontend API calls, mocked responses, hardcoded data, temporary placeholders, and unfinished workflows.

Read the relevant project documentation before implementation.

Trace each important feature through the existing system instead of inspecting files in isolation.

Do not modify code during this initial audit.

## 4. Phase 2 — Build a UI-to-Backend Feature Inventory

Inspect every relevant page and user interaction in the latest UI, including but not limited to:

* Authentication and account management.
* Dashboard overview, statistics, and charts.
* Lists, tables, detail views, search, filters, sorting, and pagination.
* Create, edit, delete, archive, and status-change actions.
* Forms, validation, modals, confirmation dialogs, and multi-step workflows.
* Templates, invitations, content editing, previews, and publishing workflows, where present.
* User settings, subscriptions, notifications, and other available modules.
* Any additional features that exist in the actual UI.

Only include features that actually exist in the current project. Do not invent product functionality.

For each feature, identify:

* Page and UI component.
* User action or data requirement.
* Expected input and output.
* Existing frontend integration.
* Existing endpoint, if any.
* Backend service and database entities involved.
* Authentication and authorization requirements.
* Current implementation status.
* Required changes.

Create a traceable mapping from UI components to frontend API calls, backend endpoints, services, and database operations.

## 5. Phase 3 — Perform an API Gap Analysis

Compare the feature inventory with the actual backend implementation.

Classify each finding into one of these categories:

**A. Already supported**

* The existing endpoint and business logic correctly support the latest UI.
* No unnecessary changes are required.

**B. Existing endpoint requires modification**

* The endpoint exists, but its response schema, request parameters, validation, business logic, permissions, or behavior no longer matches the current requirements.

**C. Missing endpoint**

* The UI requires a backend capability that does not currently exist.
* Implement a new endpoint only after confirming that the capability cannot reasonably be supported by an existing endpoint.

**D. Frontend integration gap**

* The backend already supports the feature, but the frontend still uses mock data, hardcoded values, outdated API calls, or an incorrect response mapping.

**E. Data model or migration gap**

* The required behavior cannot be implemented correctly using the current schema.
* Determine whether a migration, relationship, index, constraint, or other database change is necessary.

**F. Product or specification ambiguity**

* The UI does not establish enough information to determine the correct business behavior.
* Document the ambiguity instead of inventing important business rules.

For every finding, record the affected UI feature, endpoint, current behavior, expected behavior, required change, dependencies, and acceptance criteria.

Produce these documents before implementation:

* `docs/backend-ui-alignment-audit.md`
* `docs/api-gap-analysis.md`
* `docs/api-change-plan.md`

Follow existing documentation conventions if equivalent documents already exist. Update them instead of creating unnecessary duplicates.

## 6. Phase 4 — Design the API Changes Before Coding

For every endpoint that needs to be added or modified, define:

* HTTP method and endpoint path.
* Purpose and affected UI feature.
* Authentication and authorization requirements.
* Path parameters, query parameters, and request body.
* Validation rules and business constraints.
* Success response schema with representative JSON.
* Relevant HTTP status codes and error response format.
* Pagination, filtering, sorting, and search behavior where needed.
* Database operations and transaction requirements.
* Related frontend components and API client changes.
* Automated tests and acceptance criteria.

Reuse existing API conventions, naming patterns, response envelopes, error formats, middleware, and architecture.

Do not introduce a second API convention without a clear reason.

Avoid creating separate endpoints for every individual UI component when an existing resource-oriented endpoint can support the workflow cleanly.

However, do not overload unrelated endpoints with responsibilities that belong to distinct business operations.

If an API contract change would break existing consumers, identify the impact and preserve compatibility where practical. If a breaking change is necessary, document the migration requirements explicitly.

## 7. Phase 5 — Implement the Backend Changes

After completing the audit and API change plan, implement the approved changes using the existing project architecture.

Requirements:

* Preserve working backend functionality that is still required.
* Reuse existing services, repositories, models, and shared utilities when appropriate.
* Keep business logic out of routing and transport handlers.
* Follow the project's established architectural boundaries.
* Validate all incoming requests on the server.
* Use database transactions for operations that require atomicity.
* Handle missing resources, invalid input, conflicts, and unexpected failures consistently.
* Add appropriate database migrations for required schema changes.
* Keep database credentials, tokens, and secrets out of source code.
* Do not silently swallow errors or return fabricated success responses.
* Avoid duplicate business logic and redundant endpoints.
* Do not replace real persistence with in-memory data or hardcoded responses.
* Do not perform unrelated refactors or rewrite the backend from scratch.

For every newly introduced endpoint, implement its complete flow through the appropriate application/service and persistence layers.

## 8. Phase 6 — Integrate the Latest UI with the Backend

Update the frontend to use the correct backend APIs.

Remove obsolete mock data, hardcoded business values, and temporary placeholders from production flows where real API data should be displayed.

For each relevant UI workflow, ensure that:

* Initial data loads from the correct API.
* Create and edit forms submit valid requests.
* Successful mutations update the UI correctly.
* Lists and dashboard statistics refresh when appropriate.
* Search, filters, sorting, and pagination behave consistently with backend capabilities.
* Loading, empty, success, validation-error, unauthorized, not-found, server-error, and network-error states are handled properly.
* Form state and user input are preserved appropriately when recoverable errors occur.
* Authentication and session expiration are handled according to the existing application design.
* No sensitive information is exposed to the client unnecessarily.

Keep the approved UI design intact. Do not redesign the pages simply because the backend contract differs from the old implementation.

Do not make unrelated visual changes, modify approved copy, replace existing assets, or remove animations and interactions.

If the current UI cannot be supported by the existing backend, implement the necessary API changes rather than hiding the feature or replacing it with a static placeholder.

## 9. Phase 7 — Security and Data Integrity

Review every affected API for:

* Authentication bypass.
* Missing authorization checks.
* Broken object-level authorization and insecure direct object references (IDOR).
* Cross-user or cross-tenant data exposure.
* SQL injection and unsafe query construction.
* Insufficient input validation.
* Mass assignment and unauthorized field modification.
* Sensitive data leakage in responses and logs.
* Unsafe file or media operations, if applicable.
* Rate-limiting requirements for sensitive or abuse-prone operations.
* Transaction, concurrency, and duplicate-submission issues where relevant.

Never rely solely on frontend checks to enforce permissions.

Derive the authenticated user's identity from the trusted authentication context. Do not trust a client-supplied user ID as proof of ownership.

Preserve existing security controls and strengthen them when required by the new API behavior.

## 10. Phase 8 — Testing and Verification

Run the application and verify the actual integration, not just the code structure.

Add or update tests covering the affected functionality.

At minimum, verify:

* Successful requests with valid input.
* Missing and invalid parameters.
* Invalid request bodies.
* Unauthenticated requests.
* Authenticated users without the required permissions.
* Access to another user's resources.
* Nonexistent resources.
* Database errors and relevant conflict scenarios.
* Correct response schemas and status codes.
* Frontend loading, empty, success, and failure states.
* Complete UI-to-API-to-database workflows.
* Regression of existing functionality that should remain unchanged.

Use the project's existing testing framework and conventions.

Run relevant unit tests, integration tests, API tests, frontend checks, linting, and build commands where available.

If external services or infrastructure prevent a test from running, document the limitation. Never report an unexecuted test as passing.

## 11. Phase 9 — Seed Data and Local Development

Determine whether the existing seeders and development data are sufficient to exercise the latest UI.

If required data is missing:

* Update or create seeders for the actual data model.
* Include representative records for the relevant dashboard cards, charts, tables, filters, statuses, and detail pages.
* Include related records and valid foreign-key relationships.
* Ensure seeded data respects constraints and business rules.
* Make seeders deterministic and safely repeatable where practical.
* Avoid inserting duplicate records every time a seeder runs.
* Keep development/test seed data separate from production data.
* Never seed fake records into production automatically.

Document how to apply migrations, seed local data, start the application, and verify the relevant workflows.

Seeders are for local development and testing; production endpoints must use real persistence and business logic.

## 12. Scope and Execution Rules

Work incrementally and follow this sequence:

1. Audit the latest UI and existing backend.
2. Produce the feature inventory and API gap analysis.
3. Design the required API changes.
4. Identify dependencies and implementation order.
5. Implement the backend and database changes.
6. Integrate the frontend.
7. Update seeders and documentation where needed.
8. Run tests and verify complete workflows.
9. Report remaining gaps and risks.

Do not stop after producing the audit and plan. Continue with implementation once the required behavior is sufficiently clear.

If a critical business rule or security requirement is ambiguous, flag it as `BLOCKER` and explain what decision is needed. Continue implementing independent, unblocked work where possible.

For noncritical ambiguity, document the assumption and choose the safest option consistent with existing project conventions.

Do not delete existing endpoints, migrations, data models, or working features merely because they are absent from the new UI. Confirm whether they are used by other consumers before changing or removing them.

Do not claim completion based only on successful compilation.

## 13. Definition of Done

The task is complete when:

* Every relevant UI feature has a documented backend integration status.
* Every required UI workflow is mapped to the appropriate API and persistence logic.
* Missing endpoints have been implemented where genuinely necessary.
* Existing endpoints have been updated where their contracts or behavior no longer match requirements.
* The frontend uses the correct API contracts and no longer depends on obsolete mock data for completed production workflows.
* Database migrations and seeders are provided where required.
* Authentication, authorization, validation, and data integrity are verified.
* Relevant tests pass, or remaining failures are explicitly documented.
* The application builds and the affected workflows have been exercised.
* Existing functionality outside the intended scope remains intact.
* API documentation and the gap analysis reflect the actual implementation.

## 14. Final Report

When finished, provide a concise but specific report containing:

1. **Audit summary** — key differences between the latest UI and existing backend.
2. **Endpoint inventory** — existing endpoints reused, modified endpoints, new endpoints, and obsolete endpoints identified. Do not remove obsolete endpoints without confirming their usage.
3. **Database changes** — migrations, schema updates, indexes, relationships, and seeders.
4. **Frontend integration** — pages and workflows connected to real APIs.
5. **Security changes** — authorization, validation, ownership, and data-integrity improvements.
6. **Testing results** — commands executed, tests passed, tests failed, and tests not run.
7. **Remaining gaps** — unresolved blockers, assumptions, limitations, and follow-up work.
8. **Documentation** — paths to the audit, API gap analysis, and updated API specifications.

For every reported change, reference the actual files and endpoints involved.

**Final principle:** The latest approved UI defines the required user experience, the existing backend provides reusable functionality and established business rules, and the API contract connects the two. Make the smallest complete set of changes necessary to deliver a secure, functional, testable, end-to-end system.
