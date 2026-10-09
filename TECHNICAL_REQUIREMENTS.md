ApexForge — Technical Requirements Document (TRD)

Version 1.0 · Technical baseline and development reference

1. Technical overview

ApexForge is a motorsport telemetry, vehicle dynamics, and simulation platform designed to evolve from the existing Racing Telemetry Analyzer.

Its technical foundation combines:

Frontend: React + JavaScript

Backend: ASP.NET Core Web API + .NET 10

Database: MongoDB

Future 3D visualization: Three.js

Future real-time communication: SignalR, if required

Future AI capabilities: A separately integrated analysis service, introduced only when appropriate

The architecture should be modular so that new capabilities can be added without rebuilding the foundation.

2. Existing technical foundation

These components have already been established and tested.

Component

	

Current implementation




Frontend

	

React + JavaScript




Frontend development URL

	

http://localhost:5173




Backend

	

ASP.NET Core Web API, .NET 10




Backend URL

	

http://localhost:5006




Database

	

MongoDB Community Server




Database name

	

ApexForgeDb




Main collection

	

vehicles




API integration

	

React communicates with .NET API




Vehicle operations

	

GET, POST, PUT, DELETE




Health check

	

/api/mongo-health

MongoDB connection configuration:

{
  "MongoDB": {
    "ConnectionString": "mongodb://127.0.0.1:27017",
    "DatabaseName": "ApexForgeDb"
  }
}

This configuration is for the existing local development setup. Production deployment will require appropriate secrets management and database access controls.

3. System architecture

React frontend

Garage · Telemetry UI · Charts · 3D views

ASP.NET Core Web API

Controllers · Validation · Services · Business logic

MongoDB

Vehicles · Tracks · Sessions · Telemetry · Results

The React application must not connect directly to MongoDB. All database operations should pass through the backend API.

4. Frontend technical requirements

Technology: React with JavaScript.

The frontend should:

Use reusable React components.

Keep API communication separate from visual components where practical.

Maintain clear loading, empty, success, and error states.

Validate user inputs before submitting forms.

Display server errors without crashing the page.

Use responsive layouts suitable for desktop and laptop screens.

Support a consistent dark motorsport-inspired interface.

Render telemetry charts efficiently and avoid unnecessary re-renders.

Integrate Three.js as a separate visualization module when 3D development begins.

Suggested organization, subject to inspecting the existing code first:

ApexForge.Client/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   │   └── api.js
│   ├── hooks/
│   ├── utils/
│   ├── styles/
│   └── App.jsx
├── package.json
└── ...

This is a recommended structure, not an instruction to move or rename existing files unnecessarily.

5. Backend technical requirements

Technology: ASP.NET Core Web API on .NET 10.

The backend should:

Use REST APIs for standard data operations.

Separate controllers, services, models, and configuration.

Use dependency injection for application services and MongoDB dependencies.

Validate incoming request data.

Return appropriate HTTP status codes.

Handle exceptions consistently.

Avoid putting complex business logic directly inside controllers.

Keep secrets and environment-specific settings out of source code.

Document endpoints and request/response formats.

Suggested organization:

ApexForge.Api/
├── Controllers/
├── Models/
├── Services/
├── Settings/
├── Program.cs
├── appsettings.json
└── ...

Antigravity must inspect the actual project before applying this organization.

6. Database requirements

Database: MongoDB using the official MongoDB .NET/C# Driver.

Initial collection

vehicles

Expected document fields:

{
  "_id": "MongoDB ObjectId",
  "vehicleId": 1,
  "name": "BMW M4 GT3 EVO",
  "category": "GT3",
  "horsepower": 600
}

The _id value above is illustrative; MongoDB stores it as an ObjectId, not as the literal string shown.

Planned collections

Collection

	

Purpose




vehicles

	

Vehicle specifications and metadata




tracks

	

Track layouts and metadata




sessions

	

Recorded or simulated driving sessions




laps

	

Lap timing and lap-specific information




telemetryPoints

	

Timestamped vehicle telemetry




analysisResults

	

Derived metrics and recommendations




counters

	

Sequential application identifiers, where required

These collections are planned, not all implemented.

Database rules

Use MongoDB ObjectIds for document identity.

Keep application-level identifiers consistent.

Add indexes for commonly queried fields.

Avoid storing large telemetry histories inside a single oversized document.

Define relationships through stable IDs and query patterns.

Validate imported data before persistence.

Use a deliberate backup and restore strategy before production use.

For telemetry, consider separating session metadata from the large volume of timestamped samples.

7. API requirements

The existing vehicle API should be preserved and tested before new endpoints are added.

Method

	

Endpoint

	

Purpose




GET

	

/api/vehicles

	

Retrieve vehicles




POST

	

/api/vehicles

	

Create a vehicle




PUT

	

/api/vehicles/{id}

	

Update a vehicle




DELETE

	

/api/vehicles/{id}

	

Delete a vehicle




GET

	

/api/mongo-health

	

Check database connectivity

Planned endpoint groups include:

/api/tracks

/api/sessions

/api/telemetry

/api/analysis

The final routes and request schemas should be defined when those modules are implemented.

API conventions

Use HTTP status codes correctly: 200, 201, 204, 400, 404, and 500 where appropriate.

Return consistent JSON responses.

Validate IDs and request bodies.

Never expose database credentials or internal exception details.

Use pagination or bounded queries for large telemetry datasets.

Configure CORS for the actual frontend development origin rather than allowing every origin indiscriminately.

8. Telemetry data requirements

The telemetry system should eventually support data such as:

Field

	

Description




timestamp

	

Sample time




distance

	

Distance travelled




speed

	

Vehicle speed




rpm

	

Engine speed




gear

	

Selected gear




throttle

	

Throttle input




brake

	

Brake input




steering

	

Steering input




lapNumber

	

Lap associated with the sample




sector

	

Sector or track segment, if available




lateralG

	

Lateral acceleration




longitudinalG

	

Longitudinal acceleration

These are target fields, not a claim that every data source will provide all of them.

The import pipeline must handle missing columns, invalid numeric values, inconsistent timestamps, and units. Imported values should not be silently invented to fill gaps.

9. Performance requirements

ApexForge must remain usable on modest hardware, including systems with integrated graphics and limited memory.

Technical expectations:

Load only the data needed for the current screen.

Avoid sending entire telemetry histories when a smaller range is sufficient.

Downsample chart data for display when appropriate, while retaining original data for analysis.

Use background processing for expensive analysis where practical.

Avoid unnecessary continuous 3D rendering.

Provide clear loading states for large imports and computations.

Measure performance before introducing caching or complex optimization.

Specific response-time targets should be set after realistic datasets and target hardware are established.

10. Security requirements

Even for a local academic project:

Bind the local database to localhost unless remote access is explicitly required.

Do not expose MongoDB directly to the public internet.

Keep credentials and secrets out of Git.

Validate and sanitize imported files.

Restrict uploaded file types and sizes.

Prevent unauthorized file paths from being accessed through upload/import features.

Use HTTPS and appropriate authentication/authorization when remote deployment is introduced.

Avoid destructive database operations without explicit approval and a backup.

11. Testing requirements

Every new feature should be verified at the appropriate level.

Build testing: The .NET API builds successfully.

API testing: Endpoints return expected responses and handle invalid requests.

Database testing: Records persist and can be retrieved correctly.

Frontend testing: React screens display API data and handle failures.

Integration testing: Frontend, backend, and MongoDB work together.

Regression testing: Existing vehicle CRUD operations continue to work after changes.

A feature should not be marked complete merely because its UI appears on screen.

12. Development roadmap

Phase 1 — Foundation verification: Inspect the current repository, configuration, MongoDB connection, and vehicle CRUD. Preserve the working integration.

Phase 2 — Core domain: Define and implement tracks, sessions, and their API/data models.

Phase 3 — Telemetry pipeline: Add CSV import, validation, storage, and telemetry visualization.

Phase 4 — Analysis: Add lap comparison, metrics, replay controls, and rule-based analysis.

Phase 5 — 3D visualization: Integrate Three.js for selected vehicle and track visualizations, once the data model is ready.

Phase 6 — Advanced capabilities: Evaluate SignalR, AI-assisted analysis, anomaly detection, and prediction based on actual requirements and available time.

13. Rules for Antigravity

These rules are especially important for protecting your foundation, Viggi. 🛠️

Do not recreate ApexForge from scratch.

Inspect the current source code and Git status before editing.

Preserve the working React → .NET API → MongoDB integration.

Do not reintroduce SQL Server or EF Core into the active architecture without explicit approval.

Keep the archived SQL backup intact.

Implement one coherent feature at a time.

Build and test after each meaningful change.

Do not replace working code just to match a proposed folder structure.

Do not claim that a feature works until it has been verified.

Explain significant changes, configuration updates, and any manual steps required.

14. Definition of technical success

The technical foundation is considered healthy when:

The React frontend starts successfully.

The ASP.NET Core API builds and runs.

The API connects to MongoDB.

Vehicle GET, POST, PUT, and DELETE operations work.

React displays persisted vehicle records from the API.

Existing functionality survives future changes.

New modules can be added without coupling the entire application together.

Final recommendation: Keep React + JavaScript, ASP.NET Core Web API + .NET 10, and MongoDB as the current foundation. Treat Three.js, SignalR, and AI as later additions—not reasons to rewrite the working system.