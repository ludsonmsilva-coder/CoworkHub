import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

function createMissingSupabaseClient(): SupabaseClient {
  const emptyResult = { data: [], error: null as null, count: 0 };
  const emptySingleResult = { data: null, error: null as null };

  const createBuilder = (mode: "select" | "single" | "mutation" = "select") => {
    const builder: any = {
      select: () => builder,
      eq: () => builder,
      or: () => builder,
      order: () => builder,
      limit: () => builder,
      gte: () => builder,
      lte: () => builder,
      gt: () => builder,
      lt: () => builder,
      in: () => builder,
      ilike: () => builder,
      neq: () => builder,
      match: () => builder,
      maybeSingle: () => createBuilder("single"),
      single: () => createBuilder("single"),
      insert: () => createBuilder("mutation"),
      update: () => createBuilder("mutation"),
      delete: () => createBuilder("mutation"),
      upsert: () => createBuilder("mutation"),
      then: (onFulfilled: any, onRejected: any) =>
        Promise.resolve(mode === "single" ? emptySingleResult : emptyResult).then(onFulfilled, onRejected),
      catch: (onRejected: any) =>
        Promise.resolve(mode === "single" ? emptySingleResult : emptyResult).catch(onRejected),
      finally: (onFinally: any) =>
        Promise.resolve(mode === "single" ? emptySingleResult : emptyResult).finally(onFinally),
    };

    return builder;
  };

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: new Error("Supabase não configurado no ambiente de produção."),
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: new Error("Supabase não configurado no ambiente de produção."),
      }),
    },
    from: () => createBuilder(),
  } as unknown as SupabaseClient;
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : createMissingSupabaseClient();
