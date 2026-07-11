import { Text, View } from "react-native";
import type { MemberStatus } from "@/types";
import { useAppPreferences } from "@/hooks/useAppPreferences";

const CONFIG: Record<MemberStatus, { labelKey: string; bg: string; fg: string }> = {
  active: { labelKey: "badge.active", bg: "#ECFDF5", fg: "#059669" },
  trial: { labelKey: "badge.trial", bg: "#EFF6FF", fg: "#0E4A7A" },
  overdue: { labelKey: "badge.overdue", bg: "#FEF2F2", fg: "#DC2626" },
  inactive: { labelKey: "badge.inactive", bg: "#F3F4F6", fg: "#6B7280" },
};

export function StatusBadge({ status }: { status: MemberStatus }) {
  const { t } = useAppPreferences();
  const c = CONFIG[status] ?? CONFIG.inactive;
  return (
    <View
      className="px-2.5 py-1 rounded-full"
      style={{ backgroundColor: c.bg }}
    >
      <Text className="text-xs font-semibold" style={{ color: c.fg }}>
        {t(c.labelKey)}
      </Text>
    </View>
  );
}
