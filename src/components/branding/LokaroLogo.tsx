import { Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

interface Props {
  size?: number;
  showWordmark?: boolean;
  subtitle?: string;
  dark?: boolean;
}

export function LokaroLogo({
  size = 56,
  showWordmark = true,
  subtitle,
  dark,
}: Props) {
  const textColor = dark ? "#E2E8F0" : "#0F172A";
  const subtitleColor = dark ? "#94A3B8" : "#475569";

  return (
    <View className="flex-row items-center">
      <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Defs>
          <LinearGradient id="lokaroGrad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#0E4A7A" />
            <Stop offset="1" stopColor="#0B3A62" />
          </LinearGradient>
        </Defs>

        <Path
          d="M12 18C12 12.4772 16.4772 8 22 8H42C47.5228 8 52 12.4772 52 18V46C52 51.5228 47.5228 56 42 56H22C16.4772 56 12 51.5228 12 46V18Z"
          fill="url(#lokaroGrad)"
        />
        <Path
          d="M22 19C22 17.8954 22.8954 17 24 17H29C30.1046 17 31 17.8954 31 19V45C31 46.1046 30.1046 47 29 47H24C22.8954 47 22 46.1046 22 45V19Z"
          fill="#F8FAFC"
        />
        <Path
          d="M33 36L41.7279 27.2721C42.5089 26.4911 43.7752 26.4911 44.5562 27.2721L46.7279 29.4438C47.5089 30.2248 47.5089 31.4911 46.7279 32.2721L36.2721 42.7279C35.4911 43.5089 34.2248 43.5089 33.4438 42.7279L31.2721 40.5562C30.4911 39.7752 30.4911 38.5089 31.2721 37.7279L33 36Z"
          fill="#14B8A6"
        />
      </Svg>

      {showWordmark ? (
        <View className="ml-3">
          <Text style={{ color: textColor, fontSize: 25, fontWeight: "800", letterSpacing: 0.2 }}>
            Lokaro
          </Text>
          {subtitle ? (
            <Text style={{ color: subtitleColor, fontSize: 12, marginTop: 1 }}>{subtitle}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
