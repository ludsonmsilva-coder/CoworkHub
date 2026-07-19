import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Member, Space, UserRole } from "@/types";

function parsePaidEmailOverrides() {
  const raw = process.env.EXPO_PUBLIC_PAID_EMAIL_OVERRIDES;
  const source = raw && raw.trim().length > 0 ? raw : "";

  return new Set(
    source
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

const PAID_EMAIL_OVERRIDES = parsePaidEmailOverrides();

function hasPaidOverride(email?: string | null) {
  return PAID_EMAIL_OVERRIDES.has(email?.toLowerCase() ?? "");
}

type BillingAccessRow = {
  plan: "free" | "starter" | "pro";
  status: "inactive" | "pending" | "active" | "cancelled";
};

async function loadBillingAccessByEmail(email?: string | null) {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) return null;

  try {
    const { data, error } = await supabase
      .from("billing_access")
      .select("plan, status")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      // Tabela/políticas podem não existir em ambientes legados.
      return null;
    }

    return (data as BillingAccessRow | null) ?? null;
  } catch {
    return null;
  }
}

function resolvePlanWithBilling(
  currentPlan: Space["plan"],
  billing: BillingAccessRow | null,
  hasOverride: boolean
): Space["plan"] {
  if (billing) {
    if (billing.status === "active") return billing.plan;
    if (billing.status === "cancelled" || billing.status === "inactive") return "free";
  }

  if (hasOverride) return "pro";
  return currentPlan;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  space: Space | null;
  member: Member | null;
  role: UserRole | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [space, setSpace] = useState<Space | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string | undefined, userEmail?: string | null) => {
    if (!userId) {
      setSpace(null);
      setMember(null);
      setRole(null);
      return;
    }

    const paidOverride = hasPaidOverride(userEmail);
    const billingAccess = await loadBillingAccessByEmail(userEmail);

    // 1) É dono de um espaço? -> operador
    const { data: ownedSpace } = await supabase
      .from("spaces")
      .select("*")
      .eq("owner_id", userId)
      .maybeSingle();

    if (ownedSpace) {
      const nextSpace = ownedSpace as Space;
      nextSpace.plan = resolvePlanWithBilling(nextSpace.plan, billingAccess, paidOverride);
      setSpace(nextSpace);
      setMember(null);
      setRole("operator");
      return;
    }

    // 2) É membro de um espaço? -> membro
    const { data: memberRow } = await supabase
      .from("members")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (memberRow) {
      setMember(paidOverride ? null : (memberRow as Member));
      setRole(paidOverride ? "operator" : "member");
      const { data: memberSpace } = await supabase
        .from("spaces")
        .select("*")
        .eq("id", (memberRow as Member).space_id)
        .maybeSingle();
      const nextSpace = (memberSpace as Space) ?? null;
      if (nextSpace) {
        nextSpace.plan = resolvePlanWithBilling(nextSpace.plan, billingAccess, paidOverride);
      }
      setSpace(nextSpace);
      return;
    }

    // 3) Nenhum dos dois -> precisa passar pelo onboarding
    setSpace(null);
    setMember(null);
    setRole(null);
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    await loadProfile(data.session?.user?.id, data.session?.user?.email ?? null);
  }, [loadProfile]);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        await loadProfile(newSession?.user?.id, newSession?.user?.email ?? null);
        setIsLoading(false);
      }
    );

    return () => sub.subscription.unsubscribe();
  }, [refresh, loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        space,
        member,
        role,
        isLoading,
        refresh,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
