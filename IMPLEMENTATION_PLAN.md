# ApexForge — Implementation Plan

**Version:** 1.0
**Purpose:** Provide Antigravity with an ordered, testable development roadmap.

## 1. Development objective

Continue the existing ApexForge project and gradually transform its working React + .NET + MongoDB foundation into a motorsport telemetry and vehicle analysis platform.

The goal is not to generate the entire application in one pass. The goal is to build reliable, connected features in manageable stages.

## 2. Mandatory starting procedure

Before writing code, Antigravity must:

1. Inspect the existing repository and Git status.
2. Read the PRD, TRD, APP_FLOW, DESIGN_BRIEF, and BACKEND_SCHEMAS documents.
3. Inspect `ApexForge.Client` and `ApexForge.Api`.
4. Verify the current frontend and backend commands.
5. Verify MongoDB configuration and the `ApexForgeDb` database.
6. Test the existing vehicle GET, POST, PUT, and DELETE endpoints.
7. Confirm that the Garage still displays persisted MongoDB records.
8. Identify incomplete, duplicated, or broken components.
9. Present a concise implementation proposal before major structural changes.

Do not recreate the project or replace working components just to follow a proposed architecture.

## 3. Phase 1 — Foundation audit and stabilization

### Tasks

* Verify frontend-to-backend connectivity.
* Verify the MongoDB connection and health endpoint.
* Verify vehicle CRUD operations.
* Check API error handling.
* Check environment configuration and CORS.
* Remove obsolete code only after confirming that it is unused.
* Ensure archived SQL files remain outside the active API project's compilation scope.
* Record known issues and current project structure.

### Acceptance criteria

* Frontend starts successfully.
* Backend builds and starts successfully.
* MongoDB health check succeeds.
* Vehicle records persist after restarting the frontend.
* Existing CRUD operations continue working.
* No unnecessary database or project rewrite is introduced.

**Do not proceed to major feature development until the foundation passes these checks.**

## 4. Phase 2 — Garage completion

### Tasks

* Review the existing Garage UI.
* Improve vehicle creation and editing.
* Add client and server validation.
* Add delete confirmation.
* Add useful empty, loading, and error states.
* Support category filtering where appropriate.
* Ensure the backend remains the source of truth.

### Acceptance criteria

* Adding a vehicle updates the Garage.
* Editing a vehicle persists changes.
* Deleting a vehicle requires confirmation.
* Invalid input is rejected.
* Reloading the application does not lose saved records.

## 5. Phase 3 — Tracks

### Tasks

* Define the Track model and MongoDB collection.
* Implement track API operations.
* Add track listing and selection UI.
* Add metadata validation.
* Support verified layout data when available.
* Track the source and accuracy of layout data.

### Acceptance criteria

* Tracks can be created, listed, updated, and deleted according to the agreed API contract.
* Invalid track metadata is rejected.
* The UI clearly distinguishes missing layouts from verified layouts.
* Existing Garage behavior remains intact.

## 6. Phase 4 — Sessions

### Tasks

* Define the Session model.
* Link sessions to vehicles and optional tracks.
* Build session creation and listing workflows.
* Validate vehicle and track references.
* Distinguish recorded sessions from simulated sessions.
* Store session status and metadata.

### Acceptance criteria

* A user can create a valid session using an existing vehicle.
* Required track selection is enforced for workflows that need it.
* Invalid or deleted references are handled gracefully.
* Sessions can be reopened after application restart.

## 7. Phase 5 — Telemetry import

### Tasks

* Design the CSV import contract.
* Add file size and content validation.
* Inspect CSV headers.
* Implement column mapping.
* Normalize units only when source units are known.
* Validate timestamps and numeric values.
* Provide an import preview.
* Report rejected rows and validation warnings.
* Store accepted telemetry samples efficiently.

### Acceptance criteria

* Valid CSV data imports correctly.
* Invalid files produce understandable errors.
* Missing measurements are not fabricated.
* Import totals match the actual accepted and rejected rows.
* Large imports do not freeze the frontend.
* The imported data can be retrieved for analysis.

## 8. Phase 6 — Telemetry analysis workspace

### Tasks

* Build the session workspace.
* Add lap selection and lap timing when the source data supports them.
* Plot available telemetry channels.
* Implement synchronized chart cursors.
* Add playback controls.
* Support time and distance-based navigation.
* Add lap comparisons.
* Ensure graph axes and units are correct.

### Acceptance criteria

* Charts display real stored telemetry.
* Playback markers correspond to the selected sample.
* Lap selection changes the displayed data correctly.
* Missing channels are handled honestly.
* Playback begins at the intended starting position and resets predictably.
* Chart interactions remain usable on target hardware.

## 9. Phase 7 — Rule-based analysis

### Tasks

* Define deterministic metric calculations.
* Add data quality checks.
* Implement supported lap and speed comparisons.
* Add braking and throttle observations where data permits.
* Store analysis results and algorithm versions.
* Explain how each result was calculated.

### Acceptance criteria

* Results can be reproduced from the same input data and algorithm version.
* Invalid or incomplete data is flagged.
* Recommendations are not generated from unavailable measurements.
* Analysis results reference the correct session.

## 10. Phase 8 — Three.js visualization

### Tasks

* Evaluate the existing frontend structure for a dedicated 3D module.
* Integrate Three.js without disrupting the core Garage and analysis screens.
* Load vehicle models from approved assets.
* Handle missing or unsupported models.
* Introduce track visualization only when appropriate geometry is available.
* Connect playback to the 3D scene when the data model supports it.
* Provide a static or 2D fallback when WebGL is unavailable.

### Acceptance criteria

* The core application works without loading the 3D scene.
* The 3D view uses actual selected vehicle and session information.
* Missing assets do not crash the application.
* Rendering remains practical on modest hardware.

## 11. Phase 9 — Advanced capabilities

Only after the core workflow is stable, evaluate:

* SignalR for genuine real-time communication needs.
* AI-assisted race engineering.
* Anomaly detection.
* Performance prediction.
* Advanced vehicle dynamics.
* Additional vehicle categories and simulation capabilities.

These are later-stage features, not prerequisites for completing the initial application.

## 12. Working method

For each phase:

1. Inspect the relevant files.
2. Confirm the expected behavior.
3. Implement one coherent feature.
4. Build the backend.
5. Run the frontend.
6. Test API and database behavior.
7. Test the user workflow.
8. Fix regressions.
9. Update documentation.
10. Report what changed and what remains incomplete.

Do not implement multiple major modules simultaneously.

## 13. Git and backup rules

* Inspect the current Git state before making changes.
* Preserve existing user modifications.
* Do not overwrite uncommitted work.
* Use small, understandable commits where practical.
* Never delete the SQL backup directory as part of cleanup.
* Do not run destructive database commands without approval.
* Do not introduce new packages without a clear reason.

## 14. Definition of done

A feature is complete only when:

* The code builds.
* Its API behavior is verified.
* Database persistence works when relevant.
* The UI handles success and failure states.
* The feature works with actual data.
* Existing workflows still work.
* Documentation is updated.
* Remaining limitations are stated clearly.

## 15. Final instructions for Antigravity

ApexForge is an existing project, not a blank starter template.

Preserve:

* React + JavaScript frontend.
* ASP.NET Core Web API on .NET 10.
* MongoDB as the active database.
* The current vehicle API and Garage.
* The existing project configuration and working integration.
* Archived SQL backup files.

Do not introduce SQL Server, Entity Framework Core, React rewrites, or alternative backend frameworks without explicit approval.

Prioritize correctness, maintainability, and a working end-to-end user journey over feature quantity.

**Start with Phase 1. Verify the foundation, report findings, and then proceed in small, testable increments.**
