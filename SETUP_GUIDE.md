# Leave Management System - Setup & Deployment Guide

## Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Database Setup
Push the database schema:
```bash
pnpm db:push
```

### 3. Seed Demo Data (Optional)
To populate the database with demo company and test users:
```bash
node server/seed-demo.mjs
```

This creates:
- **Demo Project** with 5 leave slots per day
- **Admin User**: admin@demo.com / admin123
- **Supervisor User**: supervisor@demo.com / supervisor123
- **3 Staff Users**: staff1@demo.com, staff2@demo.com, staff3@demo.com (all use password: staff123)
- **Sample Leave Requests** with different statuses (approved, pending, rejected)

### 4. Start Development Server
```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## Authentication Options

### Option 1: Local Email/Password Authentication (Default)
Users can sign up and log in with email and password. The first user automatically becomes an admin.

**Login Page:** `/auth`
- Sign up with email, password, and name
- First user becomes admin automatically
- Admins can create users with specific roles (staff, supervisor, admin, hr)

### Option 2: SAML 2.0 Enterprise Integration
For companies with existing identity providers (Okta, Azure AD, ADFS, Google Workspace):

See `SAML_SETUP_GUIDE.md` for detailed instructions on configuring SAML 2.0 integration.

## User Roles & Permissions

### Admin
- Manage users (create, edit, delete)
- Assign roles and projects
- Configure leave slots per project per day
- View reports and analytics
- Bulk import users via CSV

### Supervisor
- View team members' leave requests
- Approve/reject leave requests
- View team calendar
- See days reaching slot limits

### Staff
- Apply for leave (select date range)
- View leave balance
- Check request history and status
- View availability calendar
- Receive notifications

### HR
- View all leave requests across all projects
- Filter requests by status
- Export reports to CSV
- Final approval step (optional)

## Features

### Leave Application
- **Date Range Picker**: Select start and end dates (like hotel booking)
- **Availability Check**: Real-time slot availability display
- **Leave Balance**: Automatic balance checking before approval
- **Status Tracking**: Pending, approved, rejected statuses

### Calendar View
- **Color-coded Days**:
  - 🟢 Green: Available slots
  - 🔴 Red: No slots available
  - 🟡 Yellow: Pending requests
  - 🔵 Blue: Approved leave
  - ⚫ Gray: Past dates
- **Tooltips**: Hover to see slot usage details
- **Month Navigation**: Switch between months

### Notifications
- In-app notifications for all actions
- Notification bell icon in navbar
- Notifications for:
  - Leave request submitted
  - Request approved/rejected
  - Request modified
  - New requests (for supervisors)

### Admin Tools
- **User Management**: Create, edit, delete users
- **Slot Configuration**: Set daily leave limits per project
- **Bulk Import**: Upload CSV to import multiple users
- **Reports**: View system statistics and leave analytics

## Environment Variables

### Required
- `DATABASE_URL`: MySQL connection string
- `JWT_SECRET`: Session cookie signing secret

### Optional (for SAML 2.0)
- `SAML_ENABLED`: Enable SAML authentication (true/false)
- `SAML_ENTRY_POINT`: IdP Single Sign-On URL
- `SAML_ISSUER`: Service provider identifier
- `SAML_CERT`: IdP X.509 certificate

## Testing

Run all tests:
```bash
pnpm test
```

Tests include:
- Authentication (login, logout)
- Leave request creation and approval
- Notification system
- Role-based access control
- Calendar availability calculations

## Deployment

### Build for Production
```bash
pnpm build
```

### Start Production Server
```bash
pnpm start
```

### Docker Deployment
Create a `Dockerfile`:
```dockerfile
FROM node:22
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

Build and run:
```bash
docker build -t lms .
docker run -p 3000:3000 -e DATABASE_URL=mysql://... lms
```

## Troubleshooting

### "Database connection failed"
- Verify `DATABASE_URL` environment variable
- Ensure MySQL server is running
- Check database credentials

### "First user not becoming admin"
- Clear the users table and try again
- Ensure `getAllUsers()` returns empty array on first registration

### "Leave request submission fails"
- Check browser console for error messages
- Verify database schema is up to date: `pnpm db:push`
- Check that leave slots exist for requested dates

### "SAML login not working"
- Verify SAML configuration in environment variables
- Check IdP metadata URL is correct
- Ensure Assertion Consumer Service (ACS) URL matches IdP configuration
- Review server logs for detailed error messages

## Support

For issues or questions:
1. Check the relevant setup guide (SAML_SETUP_GUIDE.md)
2. Review server logs: `docker logs lms-server`
3. Enable debug logging in your IdP (if using SAML)
4. Contact support team

## Security Considerations

1. **Passwords**: Always use HTTPS in production
2. **Database**: Use strong credentials and restrict access
3. **Sessions**: Configure appropriate session timeouts
4. **SAML**: Enable assertion signing and encryption for enterprise deployments
5. **Backups**: Regular database backups recommended

## Next Steps

1. **Customize Branding**: Update logo and colors in settings
2. **Configure Leave Policies**: Set up leave types and balances per role
3. **Integrate Email**: Connect SMTP for email notifications
4. **Set Up Holidays**: Add company holidays to prevent leave approvals
5. **Team Training**: Train supervisors and admins on the system
