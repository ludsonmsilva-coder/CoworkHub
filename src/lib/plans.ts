// ===== Planos do Lokaro (freemium) =====

export type PlanId = "free" | "starter" | "pro";

export const PLAN_LIMITS: Record<PlanId, number> = {
  free: 2,       // até 2 unidades
  starter: 10,   // até 10 unidades
  pro: Infinity, // ilimitado
};

export const PLAN_ORDER: PlanId[] = ["free", "starter", "pro"];

// Página de upgrade por idioma: português vai pro site brasileiro (preços em R$)
export const UPGRADE_URL = "https://lokaro.co/#pricing";

export function upgradeUrl(language: string): string {
  return language === "pt-BR"
    ? "https://www.lokaro.com.br/#pricing"
    : "https://lokaro.co/#pricing";
}

export function cancelPlanUrl(language: string, plan?: string): string {
  const planLabel = (plan ?? "starter").toUpperCase();

  if (language === "pt-BR") {
    const subject = encodeURIComponent("Solicitacao de cancelamento de plano");
    const body = encodeURIComponent(
      `Olá, equipe Lokaro.\n\nQuero cancelar meu plano ${planLabel}.\n\nE-mail da conta:\nNome do espaco:\nMotivo (opcional):\n\nAguardo confirmacao por e-mail.`
    );
    return `mailto:contato@lokaro.co?subject=${subject}&body=${body}`;
  }

  const subject = encodeURIComponent("Plan cancellation request");
  const body = encodeURIComponent(
    `Hello Lokaro team,\n\nI would like to cancel my ${planLabel} plan.\n\nAccount email:\nWorkspace name:\nReason (optional):\n\nPlease confirm by email.`
  );
  return `mailto:contato@lokaro.co?subject=${subject}&body=${body}`;
}

export function planLimit(plan: string | null | undefined): number {
  return PLAN_LIMITS[(plan as PlanId) ?? "free"] ?? PLAN_LIMITS.free;
}
