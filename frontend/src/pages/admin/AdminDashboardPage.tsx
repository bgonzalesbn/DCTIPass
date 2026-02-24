import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DashboardStats } from "../../types";
import { adminAPI } from "../../services/api";
import { useEffect } from "react";

const tabs = [
  { key: "schedules", label: "Horarios", icon: "📅" },
  { key: "activities", label: "Actividades", icon: "✅" },
  { key: "challenges", label: "Retos", icon: "🎯" },
  { key: "pendingSurvey", label: "Encuesta Final", icon: "📝" },
  { key: "stickers", label: "Stickers", icon: "🏆" },
  { key: "groups", label: "Grupos", icon: "👥" },
  { key: "users", label: "Usuarios", icon: "👤" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

import AdminSchedulesTab from "./tabs/AdminSchedulesTab";
import AdminActivitiesTab from "./tabs/AdminActivitiesTab";
import AdminAwardsTab from "./tabs/AdminAwardsTab";
import AdminStickersTab from "./tabs/AdminStickersTab";
import AdminGroupsTab from "./tabs/AdminGroupsTab";
import AdminUsersTab from "./tabs/AdminUsersTab";
import AdminPendingSurveyTab from "./tabs/AdminPendingSurveyTab";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("schedules");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI
      .getStats()
      .then((res) => setStats(res.data))
      .catch(() => navigate("/home"))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  const renderTab = () => {
    switch (activeTab) {
      case "schedules":
        return <AdminSchedulesTab />;
      case "activities":
        return <AdminActivitiesTab />;
      case "challenges":
        return <AdminAwardsTab />;
      case "pendingSurvey":
        return <AdminPendingSurveyTab />;
      case "stickers":
        return <AdminStickersTab />;
      case "groups":
        return <AdminGroupsTab />;
      case "users":
        return <AdminUsersTab />;
    }
  };

  const statItems = stats
    ? [
        { label: "Usuarios", value: stats.totalUsers, icon: "👤" },
        { label: "Actividades", value: stats.totalActivities, icon: "✅" },
        { label: "Grupos", value: stats.totalGroups, icon: "👥" },
        { label: "Horarios", value: stats.totalSchedules, icon: "📅" },
        { label: "Stickers", value: stats.totalStickers, icon: "🏆" },
        { label: "Retos", value: stats.totalAwards, icon: "🎯" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with gradient */}
      <header className="bg-gradient-to-r from-[#0C2A5C] via-[#113780] to-[#1a4fa0]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-4 sm:pt-6 pb-16 sm:pb-20">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                Panel de Administración
              </h1>
              <p className="text-blue-200 text-sm mt-1">
                DCTIPass — Gestión integral
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm border border-white/20 backdrop-blur-sm transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards — overlapping the header */}
      {!loading && stats && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 -mt-12 sm:-mt-14 relative z-10">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5">
            <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-gray-100">
              {statItems.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center px-2 py-2 sm:py-3"
                >
                  <span className="text-xl sm:text-2xl mb-1">{item.icon}</span>
                  <span className="text-lg sm:text-2xl font-bold text-[#113780]">
                    {item.value}
                  </span>
                  <span className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 mt-4 sm:mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <nav className="flex min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? "border-[#113780] text-[#113780] bg-blue-50/50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4">
        {renderTab()}
      </div>
    </div>
  );
}
