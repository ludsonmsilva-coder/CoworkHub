import "../global.css";
import { Platform } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/hooks/useAuth";
import {
  AppPreferencesProvider,
  useAppPreferences,
} from "@/hooks/useAppPreferences";

// Web: interface de app não deve ter texto selecionável (campos de digitação continuam normais)
if (Platform.OS === "web" && typeof document !== "undefined") {
  document.documentElement.lang = "pt-BR";
  document.documentElement.setAttribute("translate", "no");

  const googleNotranslateMeta = document.querySelector('meta[name="google"]');
  if (!googleNotranslateMeta) {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "google");
    meta.setAttribute("content", "notranslate");
    document.head.appendChild(meta);
  }

  const style = document.createElement("style");
  style.textContent = `
    body { user-select: none; -webkit-user-select: none; }
    input, textarea { user-select: text; -webkit-user-select: text; }
  `;
  document.head.appendChild(style);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppPreferencesProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </AppPreferencesProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const { isDark } = useAppPreferences();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
