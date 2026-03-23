# NetClass — Frontend

The UI for the NetClass classroom management system. Built with **React 19 + Vite**, using **Refine** for data management, **shadcn/ui** for components, and **Tailwind CSS v4** for styling. Features role-based views for admins, teachers, and students.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Build tool | Vite 6 |
| Language | TypeScript 5 |
| Data / State | Refine v5 |
| UI Components | shadcn/ui (Radix UI primitives) |
| Styling | Tailwind CSS v4 |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table v8 |
| Icons | Lucide React |
| Routing | React Router v7 |

---

## Project Structure

```
frontend/
├── src/
│   ├── App.tsx                        # Root — Refine config, routes, AuthGuard
│   ├── App.css                        # Global styles, CSS variables, theme tokens
│   ├── index.tsx                      # React DOM entry point
│   │
│   ├── providers/
│   │   ├── auth.ts                    # Refine AuthProvider — JWT stored in localStorage
│   │   └── data.ts                    # Custom DataProvider — fetch with auto Bearer token
│   │
│   ├── hooks/
│   │   ├── useCurrentUser.ts          # Reads role + user from localStorage synchronously
│   │   └── use-mobile.ts             # Detects mobile viewport
│   │
│   ├── types/
│   │   └── index.ts                   # TypeScript types: User, ClassDetails, Subject, etc.
│   │
│   ├── constants/
│   │   └── index.ts                   # BACKEND_URL, Cloudinary config from env vars
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── login.tsx              # Split-screen login with role indicator
│   │   │   └── register.tsx           # Registration with role picker (student/teacher)
│   │   │
│   │   ├── dashboard.tsx              # Role-aware dashboard — different view per role
│   │   ├── profile.tsx                # Edit own name and image
│   │   │
│   │   ├── classes/
│   │   │   ├── list.tsx               # Table with filters; student has "Join Class" dialog
│   │   │   ├── create.tsx             # Create form — teacher auto-assigned
│   │   │   └── show.tsx               # Detail page — invite code, roster, schedule
│   │   │
│   │   ├── departments/
│   │   │   ├── list.tsx               # Searchable table
│   │   │   └── create.tsx             # Create form
│   │   │
│   │   ├── subjects/
│   │   │   ├── list.tsx               # Table with department filter
│   │   │   └── create.tsx             # Create form with department selector
│   │   │
│   │   └── users/
│   │       ├── list.tsx               # Admin-only user table with role filter
│   │       └── show.tsx               # User profile view
│   │
│   ├── components/
│   │   ├── brand/
│   │   │   └── logo.tsx               # NetClass SVG logo — LogoMark and LogoFull
│   │   │
│   │   ├── upload-widget.tsx          # Cloudinary upload widget wrapper
│   │   │
│   │   ├── ui/                        # shadcn/ui components (button, card, input, etc.)
│   │   │
│   │   └── refine-ui/
│   │       ├── buttons/               # Refine action buttons (create, delete, show, edit)
│   │       ├── data-table/            # DataTable with pagination, sorting, filtering
│   │       ├── layout/                # Sidebar, header, layout wrapper, breadcrumb
│   │       ├── views/                 # ListView, ShowView, CreateView wrappers
│   │       ├── notification/          # Toast notification provider
│   │       └── theme/                 # Dark/light mode toggle and provider
│   │
│   └── lib/
│       ├── utils.ts                   # cn() class merging utility
│       ├── cloudinary.ts              # Cloudinary image URL helpers
│       └── schema.ts                  # Shared Zod validation schemas
│
├── public/
│   └── favicon.svg                   # NetClass mortarboard favicon
│
├── index.html                         # HTML entry — loads Inter font, Cloudinary widget
├── vite.config.ts
├── tsconfig.json
├── components.json                    # shadcn/ui configuration
└── .env.example
```

---

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

The `.env` file is already pre-filled with defaults for local development:

| Variable | Default | Description |
|---|---|---|
| `VITE_BACKEND_URL` | `http://localhost:8000` | Your backend API URL |
| `VITE_CLOUDINARY_CLOUD_NAME` | _(empty)_ | Cloudinary cloud name — only needed for image uploads |
| `VITE_CLOUDINARY_UPLOAD_URL` | _(empty)_ | Cloudinary upload endpoint |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | _(empty)_ | Your unsigned upload preset name |

> Cloudinary is only required if you want to upload profile images or class banners. The rest of the app works without it.

---

## Getting Started

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Start the dev server

```bash
npm run dev
```

The app will open at **http://localhost:5173**

> Make sure the backend is already running on port 8000 before opening the app.

---

## Available Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start Vite dev server with hot-reload |
| `npm run build` | Build for production into `dist/` |
| `npm start` | Serve the production build |

---

## First Run — Creating the Admin Account

The first time you open the app there are no accounts in the database.

1. Navigate to **http://localhost:5173/register**
2. Fill in your name, email, and password
3. Select any role — **the first account is always Admin regardless of what you pick**
4. Submit the form — you are logged in automatically

After that, you can create Teacher and Student accounts from the **Users** page while logged in as Admin. Teachers and Students can also self-register at `/register` and will be assigned their chosen role.

---

## Pages and Routes

| Route | Page | Who sees it |
|---|---|---|
| `/login` | Sign in form | Everyone |
| `/register` | Create account | Everyone |
| `/` | Role-aware dashboard | All authenticated users |
| `/profile` | Edit own profile | All authenticated users |
| `/departments` | List departments | All authenticated users |
| `/departments/create` | Create department | Admin |
| `/subjects` | List subjects | All authenticated users |
| `/subjects/create` | Create subject | Admin |
| `/classes` | List classes | All — filtered by role |
| `/classes/create` | Create class | Admin, Teacher |
| `/classes/show/:id` | Class detail with roster | All — students must be enrolled |
| `/users` | List all users | Admin |
| `/users/show/:id` | User profile | Admin + self |

Any route without a valid token automatically redirects to `/login`.

---

## How Authentication Works in the Frontend

### Login / Register
Both pages make a direct `fetch()` call to the backend. On success, the token and user object are stored in `localStorage` under the keys `nc_token` and `nc_user`. The page then navigates to `/`.

### Token injection
The custom data provider in `src/providers/data.ts` reads `localStorage.getItem("nc_token")` before every API call and adds `Authorization: Bearer <token>` to the request headers. This applies to every GET, POST, PUT, and DELETE call automatically.

### Logout
Clears `nc_token` and `nc_user` from `localStorage` and redirects to `/login`.

### AuthGuard
`App.tsx` wraps all protected routes in an `<AuthGuard>` component that checks for `nc_token` in `localStorage` synchronously. If the token is missing the user is redirected to `/login` before any page renders.

### Role detection
`src/hooks/useCurrentUser.ts` reads `nc_user` from `localStorage` synchronously — no async loading, no flicker. Returns `{ user, role, isAdmin, isTeacher, isStudent }`.

---

## Role-Based UI

The UI changes based on the logged-in user's role:

### Admin
- Sees all 5 stat cards on the dashboard (classes, subjects, teachers, students, departments)
- Sees class health bar and ratio metrics
- Sees recent members list
- Has access to Departments and Subjects create pages
- Can delete any class or department
- Can see and manage all users

### Teacher
- Dashboard shows their own classes and student counts
- Classes list shows only their classes
- Create class form auto-assigns them as teacher — no teacher selector shown
- Can see the student roster and invite code on class detail pages
- Can regenerate the invite code for their own classes

### Student
- Dashboard shows enrolled classes
- Classes list shows only enrolled classes, with a "Join Class" button
- Clicking "Join Class" opens a dialog to enter an invite code
- On the class detail page, sees a confirmation that they are enrolled
- Cannot see invite codes or rosters

---

## Data Provider

The data provider in `src/providers/data.ts` is a fully custom implementation rather than using `@refinedev/rest`'s `createDataProvider`. This was necessary because the built-in wrapper does not reliably inject custom headers on every request type.

Every method (`getList`, `getOne`, `create`, `update`, `deleteOne`) calls `fetch()` directly and prepends `Authorization: Bearer <token>` from `localStorage` before the request is sent.

The base URL comes from `VITE_BACKEND_URL` and routes are constructed as `${BACKEND_URL}/api/${resource}`.

---

## Cloudinary Setup (optional)

Image upload in the class create form and profile page uses the Cloudinary Upload Widget. To enable it:

1. Create a free [Cloudinary](https://cloudinary.com) account
2. Go to **Settings → Upload → Upload presets** and create an **unsigned** preset
3. Fill in the three Cloudinary variables in your `.env` file:
   ```
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   VITE_CLOUDINARY_UPLOAD_URL=https://api.cloudinary.com/v1_1/your_cloud_name/image/upload
   VITE_CLOUDINARY_UPLOAD_PRESET=your_preset_name
   ```

If these are left empty, the upload button simply won't work — nothing else breaks.

---

## Theming

The app supports light and dark mode via `next-themes`. The toggle is in the top-right header. Theme preference is saved to `localStorage` automatically.

All colour tokens are defined as CSS custom properties in `src/App.css` using `oklch` colour values. The primary colour is a medium blue (`oklch(0.67 0.16 245)`).

Border radius is set to `0.375rem` (6px) giving inputs and buttons a slightly squared, professional appearance rather than the default pill shape.