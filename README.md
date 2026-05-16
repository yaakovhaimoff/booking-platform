# Multi-Tenant Service Booking Platform (SaaS)

An enterprise-grade, multi-tenant Software-as-a-Service (SaaS) platform built for service-based businesses (e.g., salons, barbershops, consultants). The application allows business owners (tenants) to host dynamic business profile pages, manage service offerings, and handle customer appointment scheduling.

This repository houses the entire system architecture, broken down into a Java Spring Boot backend and a React (Vite) single-page application frontend.

---

## 🛠 Tech Stack

### Backend
*   **Framework:** Java Spring Boot 3.x
*   **Security:** Spring Security & Auth0 (JWT verification)
*   **Database:** PostgreSQL (Schema-per-tenant isolation strategy)
*   **Testing:** JUnit 5, Mockito, MockMvc (Strict TDD workflow)

### Frontend
*   **Build Tool / Runtime:** Vite + React (SPA)
*   **Styling & UI:** Tailwind CSS (Modern, utility-first components)
*   **Routing:** React Router v6 (Path-based tenant routing)
*   **Authentication:** Auth0 SPA SDK

---

## 🏛 System Architecture & Component Mapping

### 1. Database Multi-Tenancy (Schema-per-Tenant)
To ensure absolute data isolation and compliance, the platform implements a dynamic **Schema-per-Tenant** architecture within a single PostgreSQL database instance.
*   **Public Schema:** Stores global platform metadata, global system user references, and tenant configuration tables (mapping tenant sub-paths to their specific schema names).
*   **Tenant-Specific Schemas:** Every onboarding business gets an isolated database schema (`tenant_[id]`) containing their respective services, operating hours, configurations, and appointments.
*   **Tenant Routing Integration:** Spring Boot intercepts incoming API requests via a Custom Filter, extracts the `X-Tenant-ID` header (or path variable), and sets a context thread-local variable. The `AbstractRoutingDataSource` routes the connection to the correct PostgreSQL schema seamlessly.

### 2. Frontend Component & Router Architecture
The application uses a **Path-Layout** strategy for tenant pages: `platform.com/store/{tenant-slug}`.
src/
├── components/          # Reusable Tailwind UI components
├── context/             # Auth and Tenant Context providers
├── views/
│   ├── LandingPage      # Public marketing site and platform onboarding
│   ├── ClientDashboard # Global customer dashboard (View & cancel all bookings)
│   ├── OwnerDashboard  # Business console (Settings, Services, Calendar)
│   └── PublicStorePage  # Tenant-specific customer profile and booking funnel

*   **LandingPage:** Main platform introduction. Includes login/registration entry points via Auth0.
*   **ClientDashboard (Global):** A single pane of glass for registered clients. Authenticated users see appointments booked across *all* business tenants on the platform, with capabilities to cancel bookings up to standard cut-off thresholds.
*   **OwnerDashboard (Private):** Secure portal for business settings:
    *   *Profile Configuration:* Business logo/image URL, metadata description, Google Maps link, WhatsApp API click-to-chat integration link.
    *   *Booking Preferences:* A system toggle enabling owners to switch between auto-confirming appointments (`CONFIRMED` by default) or putting them in a validation queue (`PENDING`).
    *   *Service Manager:* CRUD operations for services (e.g., name, duration, price).
    *   *Availability Matrix:* Defines the business's weekly operational timeline (e.g., Monday 09:00 - 17:00).
*   **PublicStorePage (Tenant-Specific):** Highly optimized client-facing view displaying the tenant's chosen image, profile information, and service catalog. Includes an interactive calendar/slot picker calculating openings dynamically.

### 3. Backend Module Breakdown
The backend application follows domain-driven modular design principles:
*   **Security Module:** Intercepts JSON Web Tokens (JWTs) issued by Auth0. Validates tokens cryptographically using Auth0 JSON Web Key Sets (JWKS) and populates the Spring Security Context.
*   **Tenant Management Module:** Registers new tenants, configures metadata, and executes migrations to provision isolated PostgreSQL database schemas dynamically during onboarding.
*   **Catalog Module:** Handles CRUD APIs for services within the scope of the active database tenant schema.
*   **Booking Engine:** Compiles business operating hours against already reserved time blocks to output available appointment slots. Handles transaction isolation to prevent double-booking issues.

---

## 🔄 Core Business Logic & State Rules

### Appointment States
Appointments must strictly transition through the following states:
*   `PENDING`: Awaiting manual approval from the business owner (only if owner activation toggle is enabled).
*   `CONFIRMED`: Default state upon client reservation (if approval toggle is disabled) or after manual owner confirmation.
*   `CANCELLED`: Triggered when a client or business owner explicitly deletes the booking slot. Cancelled slots immediately open up for reservations again.

### Slot Allocation Logic
Open appointments are computed dynamically on the backend. A time slot is determined valid *only* if:
1. It falls within the tenant's established weekly operational business hours.
2. It does not overlap with any existing appointment in the tenant's specific schema that holds a `CONFIRMED` or `PENDING` state.
3. The slot duration matches or exceeds the required service duration.

---

## 🚀 Phase-Two Scalability (Future-Proofing Stubs)
To ensure seamless iterations without requiring major core-component refactoring down the road, the system architecture explicitly implements structural decoupling interfaces from Day 1:

### 1. Messaging & Notifications (`NotificationService`)
All backend business actions (e.g., a booking successfully moving to `CONFIRMED`) invoke an abstraction contract rather than direct notification clients.
*   **Interface:** `NotificationService` exposing methods such as `sendReminder(User client, Appointment appt)` and `sendUpdate(User client, String message)`.
*   **Initial Implementation:** `MockNotificationService`. This implementation logs clean tracking information directly to the terminal standard output (`[MOCK NOTIFICATION][SMS/WhatsApp] Reminder sent to...`).
*   *Future Expansion:* Ready to be swapped instantly with Twilio, WhatsApp Business API, or AWS SNS without altering core domain business workflows.

### 2. External Calendar Synchronization (`CalendarIntegrationService`)
*   **Interface:** `CalendarIntegrationService` exposing abstraction methods like `syncAppointment(Appointment appt)` and `evictAppointment(Appointment appt)`.
*   **Initial Implementation:** `MockCalendarIntegrationService`. Outputs tracking data to application runtime logs (`[MOCK CALENDAR] Synced appointment block for...`).
*   *Future Expansion:* Ready to be extended with the Google Calendar API or Microsoft Graph API.

---

## 🧪 Development Workflow & Engineering Constraints

This project adheres strictly to **Test-Driven Development (TDD)** guidelines. No production code changes should be introduced without an accompanying failing test proving its design intent beforehand.

### Backend Testing Requirements
*   Every API endpoint requires integration tests leveraging Spring Boot's `MockMvc` alongside automated schema-routing validation.
*   Follow the strict **Red-Green-Refactor** lifecycle loop:
    1.  **Red:** Write an architectural integration or unit assertion test that cleanly fails.
    2.  **Green:** Write the minimal implementation code necessary to satisfy and pass the test.
    3.  **Refactor:** Clean up code formatting, eliminate redundancies, optimize queries, and verify that all test suites remain functional.

### Frontend Testing & Verification
*   Components must break layouts down neatly into predictable UI rendering blocks using Tailwind CSS utilities.
*   Mock server responses using isolated test data fixtures to ensure UI stability across different tenant configurations.