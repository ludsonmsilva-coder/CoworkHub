import { Redirect } from "expo-router";

// Tela temporária do Prompt 03 — agora só redireciona para as abas
export default function LegacyHome() {
  return <Redirect href="/" />;
}
