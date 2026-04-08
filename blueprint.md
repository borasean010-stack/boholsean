# Bohol Sean Admin Dashboard Blueprint

## 1. Overview
The Bohol Sean Admin Dashboard is a dedicated web-based administrative system designed to efficiently manage Bohol tour and hotel reservations. The project focuses on a visually beautiful, intuitive, and modern user experience inspired by Firebase Studio. It features a responsive layout, a mint color theme, and a minimalist design to reduce visual fatigue.

## 2. Technical Stack
- **Frontend:** Vanilla HTML5, CSS3, Modern JavaScript (ES Modules).
- **Architecture:** Web Components (Custom Elements, Shadow DOM) for modular, reusable UI elements.
- **Styling:** Baseline CSS features including CSS Variables, `:has()` selector, Container Queries, and Flexbox/Grid layouts.
- **Backend/Data:** Firebase (Auth, Firestore, Storage).

## 3. Design Guidelines
- **Aesthetics:** Modern, premium, and luxurious.
- **Visuals:** 
  - Subtle noise texture background (`url('data:image/svg+xml,...')`).
  - Soft, deep multi-layered shadows on cards and interactive elements.
  - Interactivity: Glow effects and smooth transitions on hover/focus.
- **Typography:** Bold headlines, clean and readable sans-serif body text (e.g., Inter, Roboto).
- **Color Palette:** 
  - Primary Theme: Mint (`#3eb489`) and variations (dark/light mint).
  - Backgrounds: Clean white/light gray (`#f8fafc`, `#ffffff`).
  - Accents: Energetic and clear colors for statuses (success green, warning yellow, danger red).

## 4. Core Features & Implementation Plan
1. **Dashboard (Overview):**
   - High-level widgets showing today's bookings, total revenue, and active inquiries.
2. **Reservation Management:**
   - Data table to view, approve, and cancel bookings.
   - Status indicators and action buttons.
3. **Product Management:**
   - Forms to add, edit, or delete Bohol tour courses and hotel packages.
   - Integration with Firebase Storage for image uploads.
4. **Voucher Generator:**
   - Tools to generate booking vouchers dynamically based on reservation data.
5. **Security:**
   - Firebase Authentication to restrict access to authorized administrators only.

## 5. Current Implementation Steps
- [x] Define Blueprint (`blueprint.md`).
- [ ] Create base styles with Mint theme and modern CSS features (`admin.css`).
- [ ] Scaffold HTML structure with Web Component containers (`bohol-admin.html`).
- [ ] Implement core JS logic, Firebase initialization, and Web Components (`bohol-admin.js`).
- [ ] Verify functionality and styling (Zero console errors).
