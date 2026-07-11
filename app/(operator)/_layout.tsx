import { Redirect, Tabs } from "expo-router";
import {
  CalendarDays,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
} from "lucide-react-native";
import { useAuth } from "@/hooks/useAuth";
import { useAppPreferences } from "@/hooks/useAppPreferences";

export default function OperatorLayout() {
  const { role, isLoading } = useAuth();
  const { t, isDark } = useAppPreferences();

  if (!isLoading && role !== "operator") return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0E4A7A",
        tabBarInactiveTintColor: isDark ? "#64748B" : "#9CA3AF",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: {
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
          borderTopColor: isDark ? "#243245" : "#E5E7EB",
          backgroundColor: isDark ? "#0B1220" : "#FFFFFF",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t("tabs.dashboard"),
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: t("tabs.members"),
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: t("tabs.bookings"),
          tabBarIcon: ({ color, size }) => (
            <CalendarDays color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: t("tabs.finance"),
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tabs.settings"),
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
