# SRIT ASME Bus Tracking - High-Level Documentation

This document provides a comprehensive architectural and functional overview of the "ASME Real-Time Bus Tracker" project, extracted directly from the application's source codebase.

## 1. System Overview
The application is a full-stack Real-Time Bus Tracking and Management System. It is designed to cater to multiple stakeholders in a bus transportation ecosystem: **Students**, **Drivers**, **Conductors**, and **Administrators**.

It provides real-time location tracking using WebSockets, automated ticketing with QR code validation, online payments via Razorpay, route management, speed alerts, and push notifications via Firebase.

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, Framer Motion, React Leaflet (Maps), Socket.io-client.
- **Backend**: Node.js, Express.js 5, MongoDB (Mongoose), Socket.io (WebSockets).
- **Integrations**: Razorpay (Payments), Firebase Admin (Push Notifications), Haversine Distance (Geospatial calculations), PDFKit (Ticket generation), HTML5-QRCode (Scanning).

---

## 2. Architecture Details

### Frontend (`/frontend`)
Built using the Next.js App Router paradigm. The architecture organizes application routes based on user roles and core features.

**Key Directories:**
- `src/app/admin/`: Admin dashboard for managing buses, routes, drivers, and conductors.
- `src/app/student/`: Student portal for viewing bus routes, booking tickets, scanning QR codes, and tracking buses in real-time.
- `src/app/driver/`: Driver interface for sharing real-time GPS location via WebSockets.
- `src/app/conductor/`: Conductor interface for verifying tickets via QR scanners and managing bus occupancy.
- `src/app/login/` & `src/app/register/`: Authentication views.

### Backend (`/backend`)
A standard Model-View-Controller (MVC) API architecture with an added real-time WebSocket layer.

**Key Directories:**
- `config/`: Database (`db.js`) and environment configurations.
- `models/`: Mongoose schemas defining the data layer.
- `routes/`: Express API endpoints organized by feature.
- `controllers/`: Business logic corresponding to the routes.
- `sockets/`: WebSocket event handlers (e.g., `locationSocket.js` for broadcasting GPS coordinates).

---

## 3. Data Models (Database Schema)

The MongoDB database relies on several interconnected models:

- **User**: Represents all users (`admin`, `student`, `driver`, `conductor`). Stores authentication credentials, roles, and `subscribedBuses` for tracking preferences.
- **Bus**: Represents a vehicle. Linked to a `Route`, a `Driver`, and optionally a `Conductor`. Contains metadata like `name`, `number`, and `speedLimit`.
- **Route**: Defines the path a bus travels, including an array of `stops` with geolocation data, and `fares` between stops.
- **Ticket**: Links a `student` to a `bus` for a specific journey. Includes `startPoint`, `stopPoint`, `fare`, `status` (booked/cancelled), `paymentId`, and a boolean `used` flag for QR verification.
- **Driver**: A specific model for drivers, storing `currentLocation` as GeoJSON `Point`.
- **Conductor**: A specific model for conductors, storing standard profile information and an optional `bus` reference.
- **Feedback**: A model to capture feedback from students and drivers.
- **SpeedAlert**: Stores incidents where a bus exceeds its assigned `speedLimit`.
- **NotificationToken**: Stores Firebase Cloud Messaging (FCM) tokens for sending push notifications to devices.

---

## 4. Core Features & Workflows

### 4.1 Real-Time Tracking (Socket.io)
- **Broadcasting**: Drivers transmit their GPS coordinates using the Geolocation API on the frontend `driver` dashboard. These are sent via Socket.io to the backend (`locationSocket.js`). The location is also stored in the `Driver` model (`currentLocation` with a `2dsphere` index).
- **Receiving**: Students subscribe to specific buses. The server broadcasts the GPS coordinates only to clients in the specific "bus room", displaying live markers on a React Leaflet map.

### 4.2 Ticketing & Payments
- **Booking**: Students select a bus, start point, and stop point. The backend calculates the `fare` using `Route` fares data.
- **Payment**: Razorpay is integrated into the `paymentRoutes`. Upon successful payment, a `Ticket` is generated.
- **QR Code Generation**: A unique QR code representing the ticket ID is generated for the student using PDFKit (or frontend QR libraries).

### 4.3 QR Code Verification
- **Scanning**: The Conductor uses the `conductor` interface, which leverages QR reading libraries to read the student's ticket QR code.
- **Validation**: The backend checks the ticket ID. If valid and `used: false`, it marks it as `used: true` and grants boarding permission.

### 4.4 Admin Management
- The `admin` role has full CRUD (Create, Read, Update, Delete) access.
- Admins can create new routes, register buses, assign drivers and conductors, and view system analytics, including over-speeding alerts (`SpeedAlert`).

### 4.5 Notifications
- Uses `firebase-admin`. When critical events occur (e.g., bus approaching a stop, route changes), push notifications are dispatched to users holding registered `NotificationToken`s.

---

## 5. API Endpoints Overview

| Route Prefix | Purpose |
| :--- | :--- |
| `/api/auth` | User registration, login, and JWT issuance. |
| `/api/buses` | CRUD operations for buses. |
| `/api/routes` | Defining paths and stops. |
| `/api/drivers` | Driver management and location updates. |
| `/api/conductors` | Conductor management. |
| `/api/admin` | High-level system configuration. |
| `/api/tickets` | Booking and QR verification. |
| `/api/payments` | Razorpay order creation and verification. |
| `/api/notifications` | Firebase push notification triggers. |
| `/api/student/feedback` | Capturing student reviews. |
| `/api/driver/feedback` | Capturing driver feedback. |

## 6. Security & Infrastructure
- **Authentication**: JWT (JSON Web Tokens) are used to secure API endpoints.
- **CORS**: Secured to accept requests only from the specified `CLIENT_ORIGIN` environment variable.
- **Passwords**: Hashed securely using `bcrypt` or `bcryptjs` before storage in MongoDB.
