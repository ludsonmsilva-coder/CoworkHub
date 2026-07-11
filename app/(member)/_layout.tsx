import { Redirect, Tabs } from "expo-router";
import {
  CalendarPlus,
  CalendarRange,
  Home,
  UserCircle,
} from "lucide-react-native";
import { useAuth } from "@/hooks/useAuth";
import { useAppPreferences } from "@/hooks/useAppPreferences";

export default function MemberLayout() {
  const { role, isLoading } = useAuth();
  const { t, isDark } = useAppPreferences();

  if (!isLoading && role !== "member") return <Redirect href="/" />;

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
        name="home"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="book"
        options={{
          title: t("tabs.book"),
          tabBarIcon: ({ color, size }) => (
            <CalendarPlus color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-bookings"
        options={{
          title: t("tabs.myBookings"),
          tabBarIcon: ({ color, size }) => (
            <CalendarRange color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size }) => (
            <UserCircle color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
