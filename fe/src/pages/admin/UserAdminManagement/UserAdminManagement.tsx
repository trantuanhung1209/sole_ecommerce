import { useState, useMemo, useCallback } from "react";
import { Users, UserCog } from "lucide-react";
import UserList from "./UserList/UserList";

type TabType = "all";

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ReactNode;
}

function UserAdminManagement() {
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const tabs: TabConfig[] = useMemo(
    () => [
      {
        id: "all",
        label: "Tất cả người dùng",
        icon: <Users className="h-5 w-5" />,
      },
    ],
    []
  );

  const handleTabChange = useCallback((tabId: TabType) => {
    setActiveTab(tabId);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-card border-b border-border">
        <div className="container flex justify-between items-center mx-auto px-6 pb-8">
          {/* Title Section */}
          <div className="flex items-center gap-4">
            <div className="relative p-3 bg-primary/10 rounded-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <UserCog className="h-7 w-7 text-primary relative z-10" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground tracking-tight">
                Quản lý Người dùng
              </h1>
              <p className="text-muted-foreground mt-1.5">
                Quản lý thông tin và quyền hạn người dùng
              </p>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="relative inline-flex items-center bg-muted/50 px-10 py-5 rounded-xl border border-border/60">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    relative px-8 py-3.5 rounded-lg font-semibold text-sm
                    transition-all duration-300 ease-out
                    flex items-center gap-3 min-w-[200px] justify-center
                    ${
                      isActive
                        ? "text-primary-foreground shadow-md scale-[1.02]"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                    }
                  `}
                >
                  {isActive && (
                    <span className="absolute inset-0 rounded-lg shadow-lg transition-all duration-300 bg-primary" />
                  )}

                  <span className="relative z-10 flex items-center gap-3">
                    <span
                      className={`transition-all duration-300 ${
                        isActive ? "scale-110 rotate-[5deg]" : "scale-100"
                      }`}
                    >
                      {tab.icon}
                    </span>
                    <span className="font-bold tracking-wide">{tab.label}</span>
                  </span>

                  {!isActive && (
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 hover:opacity-100 rounded-lg transition-opacity duration-300" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-6 py-8">
        <div
          key={activeTab}
          className="animate-in fade-in slide-in-from-bottom-3 duration-400"
        >
          <UserList />
        </div>
      </div>
    </div>
  );
}

export default UserAdminManagement;
