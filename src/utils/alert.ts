import { Alert, Platform } from "react-native";

/** Alerta simples — funciona no navegador e no celular */
export function showAlert(title: string, message?: string) {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

/** Confirmação (Sim/Não) — funciona no navegador e no celular */
export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText = "Confirmar"
) {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: "Voltar", style: "cancel" },
      { text: confirmText, style: "destructive", onPress: onConfirm },
    ]);
  }
}
