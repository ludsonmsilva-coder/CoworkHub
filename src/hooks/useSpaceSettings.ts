import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Space } from "@/types";

export interface SpaceSettingsInput {
  name: string;
  timezone: string;
  currency: Space["currency"];
  logo_url: string | null;
}

export function useUpdateSpaceSettings() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: SpaceSettingsInput;
    }) => {
      const { error } = await supabase
        .from("spaces")
        .update({
          name: input.name.trim(),
          timezone: input.timezone,
          currency: input.currency,
          logo_url: input.logo_url,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard-kpis"] });
    },
  });
}
