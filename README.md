# Hattrick Football Academy — Management Platform

A production-ready, role-based academy management system built with Next.js 15 App Router, Prisma, NextAuth.js, and Tailwind CSS.

---

## Demo Credentials

| Role          | Email                      | Password    | Dashboard Path         |
|---------------|----------------------------|-------------|------------------------|
| Administrator | admin@hattrick.kw          | admin123    | /dashboard/admin       |
| Manager       | manager@hattrick.kw        | manager123  | /dashboard/manager     |
| Coach         | coach@hattrick.kw          | coach123    | /dashboard/coach       |
| Parent        | parent@hattrick.kw         | parent123   | /dashboard/parent      |

---

## Role Access Matrix

### ADMIN
**Can access:** Everything — all modules, all dashboards, player/coach/group management, payments, reports, pitches, AI assistant, announcements.  
**Cannot access:** N/A (full access).

### MANAGER
**Can access:** Manager dashboard, players (read), coaches (read), groups (read), schedule (read), payments (manage), reports (view), announcements (manage).  
**Cannot access:** Admin dashboard, player/coach/group creation/deletion, AI assistant, pitch bookings.

### COACH
**Can access:** Coach dashboard, own sessions, assigned groups, attendance marking, coach notes, announcements.  
**Cannot access:** Admin/Manager/Parent dashboards, player management, payments, reports, pitches.

### PARENT
**Can access:** Parent dashboard, own children's profiles, schedule (own children), attendance (own children), payments (own), announcements.  
**Cannot access:** Admin/Manager/Coach dashboards, all players, all coaches, all groups, reports, pitches.

---

## Role Switch Testing Checklist

### Login as ADMIN (`admin@hattrick.kw` / `admin123`)
- [ ] Redirected to `/dashboard/admin`
- [ ] Sidebar shows: Dashboard, Players, Coaches, Groups, Schedule, Pitches, Payments, Reports, Announcements, AI Assistant
- [ ] Can navigate to `/dashboard/players`
- [ ] Can navigate to `/dashboard/coaches`
- [ ] Can navigate to `/dashboard/payments`
- [ ] Can navigate to `/dashboard/ai`
- [ ] Role badge shows "Administrator" in red

### Login as MANAGER (`manager@hattrick.kw` / `manager123`)
- [ ] Redirected to `/dashboard/manager`
- [ ] Sidebar shows: Dashboard, Players, Coaches, Groups, Schedule, Payments, Reports, Announcements
- [ ] Can navigate to `/dashboard/manager/players`
- [ ] Can navigate to `/dashboard/manager/payments`
- [ ] Accessing `/dashboard/admin` redirects to `/dashboard/access-denied`
- [ ] Accessing `/dashboard/ai` redirects to `/dashboard/access-denied`
- [ ] Role badge shows "Manager" in amber

### Login as COACH (`coach@hattrick.kw` / `coach123`)
- [ ] Redirected to `/dashboard/coach`
- [ ] Sidebar shows: Dashboard, My Sessions, My Groups, Attendance, Coach Notes, Announcements
- [ ] Can navigate to `/dashboard/coach/attendance`
- [ ] Can navigate to `/dashboard/coach/groups`
- [ ] Accessing `/dashboard/admin` redirects to `/dashboard/access-denied`
- [ ] Accessing `/dashboard/manager` redirects to `/dashboard/access-denied`
- [ ] Accessing `/dashboard/payments` redirects to `/dashboard/access-denied`
- [ ] Role badge shows "Coach" in blue

### Login as PARENT (`parent@hattrick.kw` / `parent123`)
- [ ] Redirected to `/dashboard/parent`
- [ ] Sidebar shows: Dashboard, My Children, Schedule, Attendance, Payments, Announcements
- [ ] Can navigate to `/dashboard/parent/children`
- [ ] Can navigate to `/dashboard/parent/payments`
- [ ] Accessing `/dashboard/admin` redirects to `/dashboard/access-denied`
- [ ] Accessing `/dashboard/coach` redirects to `/dashboard/access-denied`
- [ ] Accessing `/dashboard/players` redirects to `/dashboard/access-denied`
- [ ] Role badge shows "Parent" in green

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
