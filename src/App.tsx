import { Refine } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import routerProvider, { DocumentTitleHandler, UnsavedChangesNotifier } from "@refinedev/react-router";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import "./App.css";

import { Toaster }                   from "./components/refine-ui/notification/toaster";
import { useNotificationProvider }   from "./components/refine-ui/notification/use-notification-provider";
import { ThemeProvider }             from "./components/refine-ui/theme/theme-provider";
import { Layout }                    from "@/components/refine-ui/layout/layout.tsx";
import { dataProvider }              from "@/providers/data";
import { authProvider }              from "@/providers/auth";
import { BookOpen, Building2, GraduationCap, Home, Users } from "lucide-react";
import { LogoMark }                  from "@/components/brand/logo.tsx";

import LoginPage       from "@/pages/auth/login.tsx";
import RegisterPage    from "@/pages/auth/register.tsx";
import Dashboard       from "@/pages/dashboard.tsx";
import DepartmentsList   from "@/pages/departments/list.tsx";
import DepartmentsCreate from "@/pages/departments/create.tsx";
import SubjectsList      from "@/pages/subjects/list.tsx";
import SubjectsCreate    from "@/pages/subjects/create.tsx";
import ClassesList       from "@/pages/classes/list.tsx";
import ClassesCreate     from "@/pages/classes/create.tsx";
import ClassesShow       from "@/pages/classes/show.tsx";
import UsersList         from "@/pages/users/list.tsx";
import UsersShow         from "@/pages/users/show.tsx";
import ProfilePage       from "@/pages/profile.tsx";

/** Minimal auth gate — redirect to /login if no token */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = typeof window !== "undefined" ? localStorage.getItem("nc_token") : null;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ThemeProvider>
          <DevtoolsProvider>
            <Refine
              dataProvider={dataProvider}
              authProvider={authProvider}
              notificationProvider={useNotificationProvider()}
              routerProvider={routerProvider}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                disableTelemetry: true,
                title: { icon: <LogoMark size={26} />, text: "NetClass" },
              }}
              resources={[
                { name: "dashboard",   list: "/",               meta: { label: "Dashboard",   icon: <Home />          } },
                { name: "departments", list: "/departments",     create: "/departments/create", meta: { label: "Departments", icon: <Building2 />      } },
                { name: "subjects",    list: "/subjects",        create: "/subjects/create",    meta: { label: "Subjects",    icon: <BookOpen />        } },
                { name: "classes",     list: "/classes",         create: "/classes/create",     show: "/classes/show/:id", meta: { label: "Classes", icon: <GraduationCap /> } },
                { name: "users",       list: "/users",           show: "/users/show/:id",       meta: { label: "Users",       icon: <Users />           } },
                { name: "profile",     list: "/profile",         meta: { label: "Profile", hide: true } },
              ]}
            >
              <Routes>
                {/* Public */}
                <Route path="/login"    element={<LoginPage />}    />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected — wrapped in AuthGuard + sidebar Layout */}
                <Route element={
                  <AuthGuard>
                    <Layout><Outlet /></Layout>
                  </AuthGuard>
                }>
                  <Route path="/"        element={<Dashboard />}   />
                  <Route path="/profile" element={<ProfilePage />} />

                  <Route path="/departments">
                    <Route index         element={<DepartmentsList />}   />
                    <Route path="create" element={<DepartmentsCreate />} />
                  </Route>

                  <Route path="/subjects">
                    <Route index         element={<SubjectsList />}   />
                    <Route path="create" element={<SubjectsCreate />} />
                  </Route>

                  <Route path="/classes">
                    <Route index           element={<ClassesList />}   />
                    <Route path="create"   element={<ClassesCreate />} />
                    <Route path="show/:id" element={<ClassesShow />}   />
                  </Route>

                  <Route path="/users">
                    <Route index           element={<UsersList />}  />
                    <Route path="show/:id" element={<UsersShow />}  />
                  </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

              <Toaster />
              <RefineKbar />
              <UnsavedChangesNotifier />
              <DocumentTitleHandler
                handler={({ resource, action }) => {
                  const labels: Record<string, string> = {
                    dashboard: "Dashboard", departments: "Departments",
                    subjects: "Subjects", classes: "Classes",
                    users: "Users", profile: "Profile",
                  };
                  const base   = labels[resource?.name ?? ""] ?? "NetClass";
                  const suffix = action && action !== "list"
                    ? ` · ${action.charAt(0).toUpperCase() + action.slice(1)}` : "";
                  return `${base}${suffix} — NetClass`;
                }}
              />
            </Refine>
            <DevtoolsPanel />
          </DevtoolsProvider>
        </ThemeProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
