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

export function planLimit(plan: string | null | undefined): number {
  return PLAN_LIMITS[(plan as PlanId) ?? "free"] ?? PLAN_LIMITS.free;
}
