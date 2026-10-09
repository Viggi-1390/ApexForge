# ApexForge — Application Flow

**Version:** 1.0
**Status:** Development specification
**Purpose:** Define how users move through ApexForge and how application features connect.

## 1. Product overview

ApexForge is a motorsport-focused vehicle telemetry, performance analysis, vehicle dynamics, and future simulation platform.

It evolves from the Racing Telemetry Analyzer into a more extensible platform supporting cars, motorcycles, trucks, race tracks, recorded telemetry, and future 3D visualization.

## 2. Existing technical foundation

* Frontend: React + JavaScript
* Backend: ASP.NET Core Web API, .NET 10
* Database: MongoDB
* Frontend development URL: http://localhost:5173
* Backend development URL: http://localhost:5006
* Database: ApexForgeDb
* Existing collection: vehicles

Vehicle CRUD operations and frontend-to-backend database integration have already been tested.

**Important:** Antigravity must inspect the existing implementation before modifying it. Do not recreate working features.

## 3. Main application navigation

The proposed primary navigation is:

1. Dashboard
2. Garage
3. Tracks
4. Sessions
5. Telemetry Analysis
6. Vehicle Dynamics
7. Settings

The navigation may be adapted to the current application structure, but the purpose of each section should remain clear.

## 4. Primary user journey

Dashboard → Garage → Select Vehicle → Select Track → Create or Import Session → Analyze Telemetry → Review Results

Users must also be able to open previously saved sessions from the Sessions section.

## 5. Screen flow

### 5.1 Dashboard

Purpose:

* Provide a quick overview of the user's motorsport workspace.
* Display recently used vehicles and sessions.
* Show recent analysis results when available.
* Provide shortcuts to important workflows.

Actions:

* Open Garage
* Open Tracks
* Import telemetry
* Resume a saved session
* Start a new session

Empty state:
When no sessions exist, show a helpful first-session prompt instead of empty charts or fabricated statistics.

### 5.2 Garage

Purpose:
Manage the user's vehicle library.

The existing Garage must continue displaying vehicles retrieved from the .NET API and MongoDB.

Actions:

* View vehicle cards
* Add a vehicle
* Edit vehicle details
* Delete a vehicle after confirmation
* Select a vehicle
* Filter vehicles by category

Vehicle categories should be extensible, including road cars, GT cars, prototypes, motorcycles, and trucks.

The current vehicle model includes:

* vehicleId
* name
* category
* horsepower

Additional vehicle properties must be introduced through controlled schema changes.

### 5.3 Tracks

Purpose:
Manage available circuits and driving environments.

Planned actions:

* Browse tracks
* View track details
* Add a track
* Edit track metadata
* Select a track for a session
* Display track layout when verified track geometry is available

A track may include its name, location, length, layout data, and supported session types.

Do not invent accurate-looking track layouts or claim that a layout is authentic without verified data.

### 5.4 Sessions

Purpose:
Create and manage recorded or simulated driving sessions.

A session connects a vehicle, a track when applicable, and telemetry data.

Workflow:

1. Select a vehicle.
2. Select a track when required.
3. Choose whether to import recorded telemetry or create a supported simulated session.
4. Enter session metadata.
5. Validate the selection and input.
6. Create or import the session.
7. Open the session workspace.

A session should store references to the selected vehicle and track rather than duplicating their complete records.

### 5.5 Telemetry import

Purpose:
Import telemetry data from supported CSV files.

Workflow:

1. Select an existing session or begin a new one.
2. Select a CSV file.
3. Inspect its headers.
4. Map source columns to supported telemetry fields when automatic mapping is insufficient.
5. Validate required fields, timestamps, numeric values, and units.
6. Display a preview of the data.
7. Confirm the import.
8. Store the data and import summary.
9. Open the telemetry analysis screen.

Requirements:

* Invalid files must produce understandable errors.
* Missing values must not be silently replaced with fabricated measurements.
* Preserve original source data when appropriate.
* Handle large imports without freezing the interface.
* Report how many records were imported, rejected, or skipped.

### 5.6 Telemetry analysis

Purpose:
Explore the recorded session and understand vehicle performance.

Planned workspace:

* Session and vehicle information
* Track information
* Lap selection
* Speed graph
* RPM graph
* Gear graph
* Throttle and brake traces
* Steering trace
* G-force data when available
* Lap comparison
* Playback and time synchronization

Interaction:

* Play, pause, and reset playback.
* Select a lap.
* Scrub through a session.
* Hover over charts to inspect sample values.
* Synchronize the selected timestamp across supported charts.
* Switch between available telemetry channels.

Do not display a channel as measured data when the source does not contain it.

### 5.7 Analysis results

Purpose:
Present calculated metrics and explain performance observations.

Planned outputs:

* Lap time and lap-to-lap differences
* Speed comparisons
* Braking and throttle observations
* Corner performance metrics when track and telemetry data support them
* Rule-based recommendations
* Data quality warnings

Calculations must be deterministic and testable. AI-generated analysis is a later optional enhancement.

### 5.8 Vehicle dynamics and 3D

Purpose:
Provide a future visualization workspace.

Potential capabilities:

* Three.js vehicle visualization
* Track and vehicle positioning
* Motion playback
* Vehicle dynamics visualizations
* Visual overlays for telemetry values

This is a later phase. It must not delay the core vehicle, session, and telemetry workflows.

## 6. Data flow

React UI → Frontend API service → ASP.NET Core API → Validation and business logic → MongoDB → API response → React UI update.

The frontend must never connect directly to MongoDB.

## 7. Navigation and state rules

* Preserve the currently selected vehicle and session while navigating related screens when practical.
* Do not create a session until required inputs are valid.
* Show loading, empty, success, and error states.
* Ask for confirmation before destructive actions.
* Handle missing or deleted vehicle and track references gracefully.
* Avoid unnecessary page reloads.
* Preserve existing routes and components unless a change is justified.

## 8. Completion criteria

The application flow is acceptable when:

* Existing Garage functionality remains operational.
* Users can navigate between implemented sections.
* Session creation validates required selections.
* Telemetry import has a clear preview and validation workflow.
* Analysis screens use actual session data.
* Unimplemented features are clearly identified rather than presented as working.
