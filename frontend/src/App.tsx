import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import LoadingSpinner from "./components/LoadingSpinner";
import "./App.css";

// Lazy load todas las páginas excepto Login y Register
const HomePage = lazy(() => import("./pages/HomePage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SchedulePage = lazy(() => import("./pages/SchedulePage"));
const BadgesPage = lazy(() => import("./pages/BadgesPage"));
const AdminBadgesUpload = lazy(() => import("./pages/AdminBadgesUpload"));
const ActivitiesPage = lazy(() => import("./pages/ActivitiesPage"));
const SubActivitiesPage = lazy(() => import("./pages/SubActivitiesPage"));

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/home"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <HomePage />
            </Suspense>
          }
        />
        <Route
          path="/profile"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <ProfilePage />
            </Suspense>
          }
        />
        <Route
          path="/schedule"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <SchedulePage />
            </Suspense>
          }
        />
        <Route
          path="/badges"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <BadgesPage />
            </Suspense>
          }
        />
        <Route
          path="/admin/badges/upload"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AdminBadgesUpload />
            </Suspense>
          }
        />
        <Route
          path="/activities"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <ActivitiesPage />
            </Suspense>
          }
        />
        <Route
          path="/activities/:activityId"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <SubActivitiesPage />
            </Suspense>
          }
        />
        <Route
          path="/"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <HomePage />
            </Suspense>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
