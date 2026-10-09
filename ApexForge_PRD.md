# ApexForge — Product Requirements Document (PRD)

**Document Version:** 1.0  
**Status:** Foundation established; product development to continue  
**Project Type:** Academic final-year project / motorsport telemetry and vehicle-dynamics platform  
**Tagline:** *Understand the data. Master the drive.*

---

## 1. Executive Summary

ApexForge is a motorsport-focused vehicle telemetry, analysis, and simulation platform. It is intended to help users organize vehicles, work with track and session data, inspect telemetry, understand vehicle behaviour, and progressively explore more advanced visualization and analysis features.

ApexForge evolves from the user's earlier Racing Telemetry Analyzer project. It is not intended to be a generic management or CRUD application. Vehicle records and other stored data support the main experience: exploring motorsport data and understanding performance.

The project will be developed incrementally. The existing React frontend, ASP.NET Core Web API backend, and MongoDB database form the working foundation. Antigravity should continue from this implementation rather than recreating the application or replacing its stack without approval.

## 2. Product Vision

Build a polished, extensible motorsport workspace that combines vehicle organization, telemetry visualization, analysis, and eventually interactive 3D vehicle/track experiences in one application.

The product should make technical vehicle data easier to explore without requiring the user to be a professional race engineer. The interface should feel like a modern motorsport engineering tool: focused, data-rich, responsive, and visually consistent.

## 3. Problem Statement

Telemetry and vehicle-performance information can be difficult to interpret when it is scattered across spreadsheets, static graphs, and separate tools. A learner or motorsport enthusiast needs a single environment in which they can manage vehicle profiles, import or inspect session data, visualize important channels, and understand performance differences.

ApexForge aims to provide that environment through a phased implementation, beginning with a reliable application and data foundation and then adding the core motorsport workflows.

## 4. Goals and Success Criteria

### 4.1 Product Goals

- Maintain a reliable connection between the React client, .NET API, and MongoDB.
- Provide a useful vehicle garage with working vehicle CRUD operations.
- Add tracks, sessions, laps, and telemetry as connected motorsport concepts.
- Support telemetry data import and meaningful visualization.
- Present useful analysis based on transparent, explainable rules before introducing optional AI features.
- Keep the codebase modular so future 3D visualization and advanced analysis can be added without a full rewrite.
- Keep the application usable on a modest Windows laptop.

### 4.2 Initial Success Criteria

The initial foundation is considered successful when:

- The React client can retrieve and display vehicles from the API.
- The API can connect to the local MongoDB database.
- Vehicle create, read, update, and delete operations work and have been manually tested.
- The API builds successfully.
- Existing vehicle data remains available after application restarts.

These foundation criteria have already been verified during setup. They do **not** mean that all planned ApexForge product features are complete.

## 5. Target Users

### Primary Users

- Motorsport and racing-game enthusiasts interested in telemetry.
- Students learning vehicle dynamics, data visualization, and web application development.
- Users who want to inspect sample or imported vehicle-session data in a clear interface.

### Secondary Users

- Amateur sim racers who want to compare laps and understand driving inputs.
- Developers or educators demonstrating telemetry concepts and vehicle-performance analysis.

ApexForge is an educational and analytical platform. Unless separately validated, its output must not be presented as certified engineering advice or as a substitute for real-world vehicle safety procedures.

## 6. Product Scope

### 6.1 In Scope

1. **Garage and vehicle profiles** — store, view, add, edit, and delete vehicle records.
2. **Track library** — create and maintain track metadata and layouts.
3. **Sessions and laps** — associate telemetry runs with a vehicle and track.
4. **Telemetry import** — support a documented CSV format and validate imported data.
5. **Telemetry visualization** — display channels such as speed, RPM, gear, throttle, brake, steering, distance, and time where data is available.
6. **Session replay** — allow users to move through telemetry in time or distance and inspect synchronized values.
7. **Performance analysis** — provide understandable metrics and rule-based observations.
8. **Comparison tools** — compare selected laps or sessions where compatible data exists.
9. **Future 3D experience** — introduce Three.js-based vehicle, track, or vehicle-dynamics visualization in a later phase.
10. **Future advanced analysis** — investigate anomaly detection, prediction, and AI-assisted explanations after the underlying data pipeline is reliable.

### 6.2 Out of Scope for the Initial Foundation

- Replacing the current stack with a different framework or database without an explicit decision.
- Rebuilding the project from scratch.
- Introducing complex AI services before core data workflows are functional.
- Claiming realistic physical simulation unless a defined model, assumptions, and validation method exist.
- Public deployment or exposing the local database to the internet as part of local development.
- A general-purpose administration or business-management product.

A user-facing telemetry-data download feature is not a planned requirement at this stage.

## 7. Technology and Architecture

### 7.1 Current Stack

| Layer | Technology | Current Role |
|---|---|---|
| Frontend | React + JavaScript | User interface and interactive views |
| Backend | ASP.NET Core Web API, .NET 10 | HTTP API and application logic |
| Database | MongoDB Community Server | Persistent application data |
| MongoDB driver | MongoDB.Driver | API-to-database communication |
| Future 3D visualization | Three.js (proposed) | Interactive 3D graphics when scheduled |

TypeScript may be considered later, but it is not a prerequisite for continuing the existing JavaScript client. Any migration must be proposed and approved before implementation.

### 7.2 Current Project Structure

```text
ApexForge/
├── ApexForge.Api/       # ASP.NET Core Web API
├── ApexForge.Client/    # React client
└── slqBackup/           # Archived SQL/EF Core material; not active API code
```

The archive folder name may currently be spelled `slqBackup`. Do not rename or delete it without confirming with the project owner. Archived SQL Server/EF Core files are retained as a fallback/reference and must remain outside the active API project's compile scope.

### 7.3 Local Development Configuration

- React development URL: `http://localhost:5173`
- API development URL: `http://localhost:5006`
- MongoDB local connection: `mongodb://127.0.0.1:27017`
- Database: `ApexForgeDb`
- Initial collection: `vehicles`
- API health check: `GET /api/mongo-health`

These are local development values, not production deployment settings. Keep MongoDB bound to localhost for local development and do not expose port `27017` publicly. Do not commit secrets or production credentials to source control.

### 7.4 Architectural Principles

- React communicates with the backend through HTTP API endpoints; it must not connect directly to MongoDB.
- The API owns validation, identifiers, persistence operations, and error responses.
- Keep controllers, models, settings, and data-access logic organized and understandable.
- Use clear request/response contracts and consistent status codes.
- Keep database-specific logic out of React components.
- Avoid introducing unnecessary architectural complexity; prefer a modular design that can grow with the project.

## 8. Existing Foundation and Current Behaviour

The following is the known working baseline at the time this PRD was prepared:

- The React garage retrieves vehicle data from the .NET API.
- The .NET API connects to MongoDB database `ApexForgeDb`.
- The `vehicles` collection stores vehicle documents.
- Vehicle API endpoints support GET, POST, PUT, and DELETE.
- Vehicle IDs are generated by the API using a counter document in a `counters` collection.
- A BMW M4 GT3 EVO record has been used to test the garage and API workflow.
- The MongoDB health endpoint has returned a connected status.
- SQL Server/EF Core code has been removed from the active API compile scope and retained separately as an archive.
- The API has built successfully after the SQL cleanup, and vehicle data remained visible in the React garage.

Antigravity must inspect the actual repository before making changes. The list above is a handover baseline, not permission to assume every file is unchanged or that every environment is currently running.

## 9. Functional Requirements

### FR-1: Vehicle Garage

The application shall allow users to:

- View the list of saved vehicles.
- Add a vehicle with a name, category, and horsepower.
- Edit an existing vehicle.
- Delete a vehicle after a clear confirmation step.
- See helpful validation and error messages.
- Distinguish vehicles by category, such as car, motorcycle, or truck, as the data model evolves.

The current API model includes `Id`, `VehicleId`, `Name`, `Category`, and `Horsepower`. New fields should be added only when they serve a defined feature and are handled consistently by the API and client.

### FR-2: Track Library

The application should allow users to create and view track profiles. A track profile may eventually include:

- Track name and location.
- Layout or configuration name.
- Track length and unit.
- Track map or reference asset.
- Optional metadata such as surface or direction.

Track metadata and track geometry must not be confused. A map image is not, by itself, a verified track-coordinate model.

### FR-3: Session and Lap Organization

Users should be able to create a session associated with a vehicle and, where applicable, a track. Sessions may contain one or more laps. Each session should have a stable identifier and enough metadata to identify the source and date of the run.

### FR-4: Telemetry Import

The application should support importing a documented CSV format. The importer must:

- Check required columns and supported units.
- Validate timestamps, numeric values, and row consistency.
- Report malformed rows instead of silently accepting corrupt data.
- Preserve the source file name and relevant import metadata.
- Avoid treating sample or synthetic data as real-world measured data.
- Explain any assumptions used to normalize or transform values.

The exact CSV schema should be defined before implementing the importer. Do not assume all racing simulators export the same columns or units.

### FR-5: Telemetry Visualization

For imported or available telemetry, the application should display relevant channels where the data exists:

- Time and/or distance.
- Speed.
- Engine RPM.
- Gear.
- Throttle and brake input.
- Steering input.
- Lap number and lap time, when provided or reliably derived.
- Optional channels such as lateral/longitudinal G-force, tyre data, suspension, weather, or vehicle setup when those channels are available.

Charts should have readable labels, units, sensible scales, and clear empty/loading/error states. Missing channels must be labelled as unavailable rather than fabricated.

### FR-6: Session Replay

Users should be able to play, pause, reset, and scrub through a telemetry session. The current time/distance marker and associated numeric values should stay synchronized with the chart data. Replay must begin at the expected start of the selected session or lap, not at the final sample by default.

### FR-7: Analysis and Recommendations

The initial analysis engine should use explainable calculations or rules. Every result should make clear which input data supports it. Examples may include:

- Speed differences between laps at matching distance points.
- Braking and throttle patterns where the relevant channels exist.
- Entry, minimum, and exit speed for a defined corner window.
- Basic outlier detection for invalid or unusual samples.

Do not invent recommendations when data is insufficient. Distinguish measured values, calculated metrics, rule-based interpretations, and future AI-generated suggestions.

### FR-8: Lap or Session Comparison

Allow users to select compatible laps or sessions for comparison. The system should handle differences in sampling rate and lap distance explicitly. It must not compare mismatched values as if they were directly equivalent without normalization or explanation.

### FR-9: 3D Visualization — Future Phase

A later phase may use Three.js for interactive vehicle models, track visualization, or a 3D replay view. The first 3D milestone should be a small, verifiable prototype rather than an attempt to build a complete physics simulator immediately.

### FR-10: Advanced Analysis — Future Phase

After data import, validation, and baseline analysis are dependable, the project may add anomaly detection, predictive estimates, or AI-assisted explanations. These features should be optional, clearly labelled, and designed so the application remains usable if an external AI service is unavailable.

## 10. Data Model Direction

The following are proposed domain concepts, not a demand to create every collection immediately:

- **Vehicle:** identity, name, category, technical specifications, and optional metadata.
- **Track:** identity, name, layout, length, units, and reference geometry/assets.
- **Session:** vehicle reference, track reference where applicable, date/source, and session metadata.
- **Lap:** session reference, lap index, lap time, validity/status, and relevant summary metrics.
- **TelemetryPoint:** timestamp or elapsed time, distance, channel values, and source/units metadata.
- **AnalysisResult:** session/lap reference, metric, result, method, explanation, and confidence/limitations where relevant.
- **VehicleSetup (later):** setup values associated with a specific vehicle and session.
- **SessionCondition (later):** available weather, surface, tyre, or environmental information.
- **SessionNote (later):** user-authored observations associated with a session or lap.

Antigravity should introduce these concepts incrementally. Before creating a large schema, define the relationships, required fields, validation rules, and how existing data will remain compatible.

### Identifier and Counter Requirement

The current vehicle creation flow uses a MongoDB counter document to generate `VehicleId`. If data is imported or pre-seeded in bulk, the counter must be initialized or advanced to at least the maximum existing `VehicleId` to avoid duplicates. MongoDB `_id` remains the document identifier; the numeric vehicle ID is a separate application-level identifier.

## 11. User Experience and Visual Direction

### 11.1 Design Goals

- Modern, dark motorsport-inspired visual language.
- Clear visual hierarchy and strong readability.
- Dense information presented without unnecessary clutter.
- Consistent spacing, typography, icons, and component behaviour.
- Responsive layout for typical laptop and desktop sizes.
- Helpful empty, loading, success, validation, and error states.
- Meaningful controls rather than decorative or non-functional buttons.

### 11.2 Garage Experience

The garage should emphasize vehicle identity and selection. Vehicle cards should clearly show the name, category, and key specification. Adding or editing a vehicle should be straightforward. Destructive actions must be deliberate and should not silently remove data.

### 11.3 Telemetry Experience

Telemetry pages should prioritize the data and its interpretation. Avoid oversized empty panels, misleading placeholder graphs, and disconnected playback controls. Graphs, current values, and replay position should remain synchronized.

### 11.4 Accessibility and Usability

- Controls should have clear labels and visible focus states.
- Colour must not be the only way to convey a state or value.
- Text and chart labels must remain readable.
- Forms should explain invalid input close to the relevant field.
- Destructive actions require confirmation.

## 12. Non-Functional Requirements

### Performance

- Keep the initial application and garage responsive on a modest Windows laptop.
- Avoid unnecessary re-renders and excessively frequent chart updates.
- Use efficient data loading and sensible limits/pagination for large telemetry datasets.
- Do not load or render every telemetry point at full detail when a reduced representation is sufficient for the visible chart; preserve raw data for calculations where required.

### Reliability

- Show clear errors when the API or database is unavailable.
- Validate inputs on the server even if the client also validates them.
- Do not report a save/delete as successful before the API confirms it.
- Keep existing data safe during schema changes and refactors.

### Maintainability

- Keep files and components focused on one responsibility.
- Use meaningful names and consistent formatting.
- Avoid duplicating the same business rules in multiple places.
- Document non-obvious calculations and units.
- Keep setup and run instructions up to date.

### Security

- Keep local development services restricted to localhost unless a deliberate deployment plan says otherwise.
- Never hardcode production secrets or API keys into source code.
- Validate all incoming API data.
- Avoid logging credentials or sensitive environment values.
- If deployed later, define authentication, authorization, HTTPS, database access control, and secret management before release.

### Data Integrity

- Define units and coordinate conventions explicitly.
- Preserve source metadata for imported telemetry.
- Prevent accidental duplicate identifiers.
- Avoid silently substituting synthetic values for missing data.
- Back up important data before destructive migrations or bulk operations.

## 13. Implementation Roadmap

The roadmap is deliberately phased. Antigravity should finish and verify each milestone before starting a much larger one.

### Phase 0 — Foundation Verification (current baseline)

- Inspect the repository and confirm the current client/API/database integration.
- Confirm vehicle GET/POST/PUT/DELETE behaviour.
- Confirm MongoDB health check and error handling.
- Verify build and client startup commands.
- Record existing endpoints, environment settings, and known limitations.

**Exit criteria:** foundation works and existing vehicle data is preserved.

### Phase 1 — Garage Stabilization

- Improve vehicle form validation and API error messages.
- Verify empty, loading, success, and failure states.
- Verify edit/delete workflows and duplicate-ID handling.
- Keep frontend/API contracts consistent.

**Exit criteria:** vehicle workflows are reliable and manually testable.

### Phase 2 — Tracks and Sessions

- Define Track and Session models and API contracts.
- Add the minimum UI for creating and selecting tracks and sessions.
- Connect sessions to vehicles and tracks where applicable.

**Exit criteria:** a user can create and retrieve a coherent vehicle/track/session record set.

### Phase 3 — Telemetry Import and Visualization

- Specify the CSV schema and supported units.
- Implement validation and import feedback.
- Store telemetry in a design appropriate for the expected data volume.
- Display the first useful telemetry charts with clear units.

**Exit criteria:** a known test CSV can be imported and its values can be verified in the UI.

### Phase 4 — Replay and Basic Analysis

- Implement synchronized play/pause/reset/scrub controls.
- Add basic lap/session comparison and transparent analysis metrics.
- Test missing data, invalid samples, different sampling rates, and session boundaries.

**Exit criteria:** replay and core analysis behave correctly on documented test data.

### Phase 5 — 3D Prototype

- Choose one small 3D use case, such as a rotatable vehicle model or a simple track scene.
- Verify performance and controls before connecting complex telemetry playback.
- Keep 3D features modular and optional.

**Exit criteria:** a stable, demonstrable prototype runs without breaking the core application.

### Phase 6 — Advanced Analysis and Polish

- Evaluate anomaly detection or AI-assisted analysis against a defined test set.
- Add features only where they provide a measurable benefit.
- Improve usability, documentation, and project presentation.

**Exit criteria:** each advanced feature has a clear purpose, tested behaviour, and documented limitations.

## 14. Testing and Acceptance Strategy

Each implementation increment should include appropriate checks:

- **Build checks:** API builds successfully; client dependencies and build/start commands work.
- **API checks:** valid requests succeed; invalid requests return meaningful errors; missing IDs are handled.
- **Database checks:** data persists after restart; generated IDs remain unique; connection failures are reported.
- **UI checks:** loading, empty, error, and success states are visible; actions produce the expected API calls.
- **Telemetry checks:** known sample values match expected chart positions and displayed metrics.
- **Replay checks:** playback begins at the start, advances in the correct direction, and synchronizes values with chart position.
- **Regression checks:** existing garage functionality continues working after new features are added.

Use small, representative test datasets before testing very large files. Synthetic sample data must be labelled as synthetic.

## 15. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Scope grows too quickly | Work in small, verifiable milestones; defer optional features |
| Existing foundation is overwritten | Inspect first, preserve working code, use version control and small changes |
| Telemetry formats differ | Define supported schemas and units; validate imports |
| Large datasets cause slow charts | Profile performance and use suitable data loading/rendering strategies |
| Sample data is mistaken for real telemetry | Label synthetic/demo data clearly and retain provenance |
| 3D work delays core workflows | Build a small independent prototype after telemetry fundamentals work |
| AI features are unreliable or unavailable | Keep analysis explainable, optional, and functional without external services |
| Database identifiers collide after bulk import | Initialize or advance counters based on existing IDs |

## 16. Antigravity Handover Instructions

Antigravity must treat this document as the product direction and the existing repository as the source of truth for current implementation details.

1. **Do not recreate ApexForge from scratch.** Continue the existing project in place.
2. Inspect the current repository, package files, API routes, MongoDB settings, models, and garage UI before editing.
3. Preserve the existing React + JavaScript, ASP.NET Core Web API (.NET 10), and MongoDB stack unless the project owner explicitly approves a change.
4. Preserve the working MongoDB connection and vehicle CRUD behaviour.
5. Keep archived SQL Server/EF Core material outside the active API project's compile scope. Do not restore it into the active project by accident.
6. Do not delete, reset, or migrate existing data without a backup and explicit approval.
7. Make changes in small increments. State which files will change and why before a large or risky refactor.
8. After each increment, build the API, run the client, and test the affected workflow.
9. Do not claim that a feature is complete until its behaviour has been implemented and verified.
10. Avoid replacing working screens with placeholder content or creating controls that do nothing.
11. Do not add unnecessary frameworks, services, packages, or architecture for hypothetical future needs.
12. Update the README or setup notes when run commands, environment configuration, or required packages change.
13. Keep local MongoDB private to the machine during development; do not expose the database port publicly.
14. Ask before making a breaking technology decision, destructive database change, or substantial scope change.

### Recommended First Assignment for Antigravity

Start by auditing the existing foundation and reporting:

- Current folder and project structure.
- API endpoints and their actual behaviour.
- MongoDB collections and document shapes.
- How the React garage fetches and mutates vehicle data.
- Build/run commands and configuration dependencies.
- Any errors or gaps found during verification.

Then propose the smallest useful next milestone and wait for approval before making broad changes. The goal of the audit is to understand and protect the working baseline, not to rebuild it.

## 17. Assumptions and Open Decisions

The following decisions should be resolved only when they become relevant to implementation:

- The exact telemetry CSV schema and supported source applications.
- The long-term storage strategy for high-volume telemetry points.
- The first track layout and whether its geometry will be imported, authored, or approximated.
- The first 3D milestone and required vehicle assets.
- Whether authentication is needed for the intended academic deployment.
- Whether future AI analysis will be local, cloud-based, or omitted.
- Whether and when TypeScript should be introduced.

These are open decisions, not permission to select complex options without discussion.

## 18. Glossary

- **Telemetry:** time- or distance-indexed measurements and control inputs recorded during a vehicle session.
- **Session:** a group of data recorded for a vehicle run, test, or simulation.
- **Lap:** one traversal of a track within a session, where lap boundaries are available or can be reliably identified.
- **Replay:** synchronized navigation through stored telemetry over time or distance.
- **Rule-based analysis:** an interpretation produced by explicit, documented conditions or calculations.
- **Synthetic data:** generated sample data that is not presented as real measured data.
- **Vehicle dynamics:** the study or modelling of how a vehicle moves and responds to forces and driver inputs.

---

## Document Control

This PRD describes the intended product direction and the known foundation baseline. It is a living document: update it when the project owner approves a significant scope, architecture, or milestone change. Planned features must remain clearly distinguished from features that have actually been implemented and tested.
