import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DashboardStats } from "../../types";
import { adminAPI } from "../../services/api";
import { useEffect } from "react";

const tabs = [
  { key: "schedules", label: "Horarios", icon: "📅" },
  { key: "activities", label: "Actividades", icon: "✅" },
  { key: "challenges", label: "Retos", icon: "🎯" },
  { key: "stickers", label: "Stickers", icon: "🏆" },
  { key: "groups", label: "Grupos", icon: "👥" },
  { key: "awards", label: "Premios", icon: "🎁" },
  { key: "users", label: "Usuarios", icon: "👤" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

// Lazy imports
import AdminSchedulesTab from "./tabs/AdminSchedulesTab";
import AdminActivitiesTab from "./tabs/AdminActivitiesTab";
import AdminChallengesTab from "./tabs/AdminChallengesTab";
import AdminStickersTab from "./tabs/AdminStickersTab";
import AdminGroupsTab from "./tabs/AdminGroupsTab";
import AdminAwardsTab from "./tabs/AdminAwardsTab";
import AdminUsersTab from "./tabs/AdminUsersTab";

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

  const renderTab = () => {
    switch (activeTab) {
      case "schedules":
        return <AdminSchedulesTab />;
      case "activities":
        return <AdminActivitiesTab />;
      case "challenges":
        return <AdminChallengesTab />;
      case "stickers":
        return <AdminStickersTab />;
      case "groups":
        return <AdminGroupsTab />;
      case "awards":
        return <AdminAwardsTab />;
      case "users":
        return <AdminUsersTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#113780]">
            Panel de Administración
          </h1>
          <button
            onClick={() => navigate("/home")}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm"
          >
            ← Volver
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      {!loading && stats && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Usuarios" value={stats.totalUsers} icon="👤" />
            <StatCard
              label="Actividades"
              value={stats.totalActivities}
              icon="✅"
            />
            <StatCard label="Grupos" value={stats.totalGroups} icon="👥" />
            <StatCard label="Horarios" value={stats.totalSchedules} icon="📅" />
            <StatCard label="Stickers" value={stats.totalStickers} icon="🏆" />
            <StatCard label="Retos" value={stats.totalChallenges} icon="🎯" />
            <StatCard label="Premios" value={stats.totalAwards} icon="🎁" />
            <StatCard label="Activos" value={stats.activeUsers} icon="🟢" />
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-1 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? "border-[#113780] text-[#113780]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm text-gray-500">{label}</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}
