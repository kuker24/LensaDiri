import { getButtonClassName } from "@/components/ui/button";
import type { OidcProvider } from "@/lib/auth/oidc";

const labels: Record<OidcProvider, string> = {
  apple: "Lanjutkan dengan Apple",
  google: "Lanjutkan dengan Google",
};

export function OidcButtons({
  operation = "login",
  providers,
}: {
  operation?: "link" | "login";
  providers: OidcProvider[];
}) {
  if (providers.length === 0) return null;
  return (
    <div className="space-y-3">
      {providers.map((provider) => (
        <a
          className={`${getButtonClassName("secondary", "md")} w-full`}
          href={`/api/auth/oidc/${provider}/start?operation=${operation}&redirectTo=${encodeURIComponent(operation === "link" ? "/dashboard/settings" : "/dashboard")}`}
          key={provider}
        >
          {operation === "link"
            ? `Tautkan ${provider === "google" ? "Google" : "Apple"}`
            : labels[provider]}
        </a>
      ))}
    </div>
  );
}
