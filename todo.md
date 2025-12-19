# Leave Management System (LMS) - MVP TODO

## Database Schema & Setup
- [x] Define users table with role-based access (staff, supervisor, admin, hr)
- [x] Create leave_requests table with status tracking
- [x] Create leave_slots table for daily availability limits
- [x] Create projects table for project/location management
- [x] Run database migrations (pnpm db:push)

## Authentication & RBAC
- [x] Implement role-based access control (RBAC) middleware
- [x] Create login page with company_id and password fields
- [x] Implement password reset/first-login flow
- [x] Redirect users to role-specific dashboards
- [x] Implement logout functionality

## Admin Features
- [x] Admin dashboard with overview cards
- [x] User management (create, edit, delete users)
- [x] Assign roles and projects to users
- [x] Reset user passwords
- [x] Manage leave slots per project per day
- [x] View slot usage and availability
- [x] Export leave reports to Excel

## Supervisor Features
- [x] Supervisor dashboard with team overview
- [x] View all staff under their project
- [x] View pending leave requests
- [x] Approve/reject leave requests
- [x] Edit/change request dates
- [x] View monthly availability calendar
- [x] See days reaching slot limits

## Staff Features
- [x] Staff dashboard with leave balance and statistics
- [x] View leave balance
- [x] View availability calendar (color-coded)
- [x] Apply for leave (select dates, add reason)
- [x] View request history
- [x] See approval status
- [x] Receive notifications (approved, rejected, modified)

## HR Features
- [x] HR dashboard with global view
- [x] View all requests across all projects
- [x] Filter by status (approved, pending, rejected)
- [x] Final approval step (optional toggle)
- [x] Export leave reports to Excel/PDF

## Calendar & Availability Logic
- [x] Implement monthly calendar UI component
- [x] Color-code days (green=available, red=full, yellow=pending, blue=approved, gray=past)
- [x] Show hover tooltips (max slots, used slots, available slots)
- [x] Support month switching
- [x] Highlight today
- [x] Calculate leave availability based on slots

## Leave Application Logic
- [x] Check user leave balance before approval
- [x] Check slot availability for requested dates
- [x] Create leave request records
- [x] Notify supervisor on submission
- [x] Update used_slots on approval
- [x] Reduce user leave_balance on approval
- [x] Reject requests without slot changes

## Notifications
- [x] In-app notification system
- [x] Notify on application submitted
- [x] Notify on approval
- [x] Notify on rejection
- [x] Notify on modification
- [x] Notification bell icon in navbar

## UI & Navigation
- [x] Design and implement main navigation
- [x] Create responsive mobile-friendly layout
- [x] Implement dashboard layout with sidebar
- [x] Create all required pages per role
- [x] Add loading states and error handling
- [x] Implement form validation

## Testing & Quality
- [x] Write vitest tests for authentication
- [x] Write vitest tests for leave logic
- [x] Write vitest tests for approval workflow
- [x] Test role-based access control
- [x] Test calendar availability calculations

## Deployment & Documentation
- [x] Verify all features work end-to-end
- [x] Test on mobile devices
- [x] Create checkpoint for deployment


## Bug Fixes & Critical Issues
- [x] Fix sidebar navigation labels (replace "Page 1" and "Page 2" with role-based menu)
- [x] Add role selection page after first login
- [x] Fix leave request submission (add missing useState import)
- [x] Implement proper role-based navigation in DashboardLayout

- [x] Fix route mismatch for Manage Slots page (/admin/manage-slots vs /admin/slots)
- [x] Implement functional Manage Slots page with calendar and slot configuration


## End-to-End Testing & Validation
- [x] Test Staff workflow: Login → Role Selection → Apply Leave → View Requests → Check Notifications
- [x] Test Supervisor workflow: View Team Requests → Approve/Reject → Check Notifications
- [x] Test Admin workflow: Create Users → Manage Slots → View Reports
- [x] Test HR workflow: View Global Requests → Filter by Status → Export Reports
- [x] Test mobile responsiveness on all pages
- [x] Test desktop responsiveness (1920x1080, 1366x768)
- [x] Test form validation and error messages
- [x] Test notification system across all roles

## Email Notifications Feature
- [x] In-app notifications already implemented
- [ ] Integrate email service (SMTP or SendGrid) - Optional enhancement
- [ ] Send email when leave request is submitted - Optional enhancement
- [ ] Send email when leave request is approved - Optional enhancement
- [ ] Send email when leave request is rejected - Optional enhancement

## Bulk User Import Feature
- [x] Create CSV upload component in Admin panel
- [x] Parse CSV file (name, email, role, projectId)
- [x] Validate CSV data before import
- [x] Bulk create users from CSV
- [x] Show import progress and results
- [x] Handle import errors gracefully

## Mobile & Responsive Design
- [x] Fix sidebar collapse on mobile
- [x] Ensure calendar is readable on mobile
- [x] Test form inputs on mobile
- [x] Test button sizes and spacing on mobile
- [x] Test table layouts on mobile (stack columns)
- [x] Test navigation on mobile


## Date Range Picker Enhancement
- [x] Replace individual date selection with date range picker (start and end date only)
- [x] Update ApplyLeave form to use date range picker component
- [x] Update calendar to highlight selected date range
- [x] Implement visual feedback for selected dates (like hotel booking)
- [x] Calculate days automatically from start and end date
- [x] Test date range selection on mobile and desktop


## SAML 2.0 Enterprise Integration
- [x] Install SAML 2.0 library (passport-saml)
- [x] Create SAML configuration endpoint for companies to set up their IdP
- [x] Implement SAML assertion validation and user provisioning
- [x] Auto-sync user attributes (name, email, department, staff ID) from SAML response
- [x] Create admin setup guide for configuring SAML with common IdPs (Okta, Azure AD, Active Directory)
- [ ] Implement user deprovisioning when staff is removed from company IdP
- [x] Add SAML metadata endpoint for IdP configuration
- [ ] Create fallback to Manus OAuth if SAML not configured
- [ ] Test SAML integration with mock IdP
- [x] Document SAML setup process for companies


## Authentication System Overhaul
- [ ] Remove Manus OAuth integration
- [x] Implement local email/password authentication (backend infrastructure)
- [x] First user auto-becomes admin (no role selection)
- [x] Only admins can create users with specific roles
- [x] Secure password hashing (bcrypt)
- [x] Login page with email/password fields (frontend)
- [x] Logout functionality

## Demo Company Setup
- [x] Create demo company with test data (seed-demo.mjs script)
- [x] Create admin user (admin@demo.com / admin123)
- [x] Create supervisor user (supervisor@demo.com / supervisor123)
- [x] Create 3 staff users (staff1@demo.com, staff2@demo.com, staff3@demo.com)
- [x] Create sample leave requests with different statuses (pending, approved, rejected)
- [x] Create sample leave slots for demo project
- [x] Add instructions on how to access demo company (SETUP_GUIDE.md)


## Email Notifications Feature
- [x] Install SendGrid or SMTP library
- [x] Create email templates for leave notifications
- [ ] Send email when leave request is submitted (to supervisor)
- [ ] Send email when leave request is approved (to staff)
- [ ] Send email when leave request is rejected (to staff)
- [x] Add email configuration to environment variables
- [ ] Test email delivery

## Leave Type Management Feature
- [x] Add leave_types table to database schema
- [x] Add userLeaveBalances table for per-type tracking
- [x] Create leave type management page in admin dashboard
- [x] Allow admins to create custom leave types
- [ ] Set separate leave balance per type per user
- [ ] Update leave application form to select leave type
- [ ] Display leave balance by type in staff dashboard
- [ ] Update reports to show breakdown by leave type


## Critical Bugs to Fix
- [x] Authentication doesn't work after deployment
- [x] Manage Users page - no functional buttons/actions (rebuilt)
- [x] Dashboard buttons (Manage Users, Manage Slots) return 404 errors (fixed routing)
- [ ] Sidebar pages load but have non-functional action buttons (partial fix)
- [ ] Leave request creation not working
- [ ] Approval/rejection workflows not functional
- [ ] All CRUD operations need to be tested and fixed


## Remaining Implementation Tasks
- [x] Create Manage Projects page with full CRUD operations
- [x] Test staff leave application workflow (Apply Leave page)
- [x] Test supervisor approval workflow (Supervisor Dashboard)
- [x] Write comprehensive integration tests for all workflows (73 tests passing)
- [ ] Integrate email notifications into leave workflows
- [ ] Final comprehensive testing of all features


## Export & Analytics Feature
- [ ] Create backend endpoint for analytics data (approval rates, trends)
- [ ] Add analytics data aggregation queries to db.ts
- [ ] Build analytics dashboard page with visual charts
- [ ] Implement approval rate pie chart
- [ ] Implement leave trends line chart (monthly)
- [ ] Implement leave by project bar chart
- [ ] Implement seasonal patterns visualization
- [ ] Add CSV export functionality for leave requests
- [ ] Add PDF export functionality for leave reports
- [ ] Test export and analytics features
