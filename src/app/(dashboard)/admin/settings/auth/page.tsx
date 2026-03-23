"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  Loader2,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// ─── Provider definitions ───────────────────────────────────────────

// ─── Brand SVG Icons ────────────────────────────────────────────────

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853"/>
      <path d="M5.84 14.09A6.68 6.68 0 0 1 5.5 12c0-.72.13-1.43.34-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.84Z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335"/>
    </svg>
  );
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
      <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
    </svg>
  );
}

function KeycloakIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2Z" fill="#4D4D4D"/>
      <path d="M12 4.5L4.5 8.25v7.5L12 19.5l7.5-3.75v-7.5L12 4.5Z" fill="#E0E0E0"/>
      <path d="m12 8-4 2v4l4 2 4-2v-4l-4-2Z" fill="#4D4D4D"/>
    </svg>
  );
}

function LineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C6.48 2 2 5.82 2 10.5c0 4.21 3.74 7.74 8.78 8.4.34.07.81.23.92.52.1.26.07.68.03.95l-.15.89c-.04.26-.21 1.02.89.56 1.1-.47 5.93-3.49 8.09-5.98C22.39 14.2 22 12.4 22 10.5 22 5.82 17.52 2 12 2Z" fill="#06C755"/>
      <path d="M19.11 10.11c0-3.47-3.47-6.3-7.74-6.3s-7.74 2.83-7.74 6.3c0 3.11 2.76 5.72 6.49 6.22.25.05.59.17.68.38.08.19.05.5.03.69l-.11.66c-.03.19-.16.75.66.41.82-.34 4.42-2.6 6.03-4.46 1.11-1.22 1.7-2.55 1.7-3.9Z" fill="#06C755"/>
      <path d="M10.22 8.54H9.5a.2.2 0 0 0-.2.2v3.15a.2.2 0 0 0 .2.2h.72a.2.2 0 0 0 .2-.2V8.74a.2.2 0 0 0-.2-.2Zm4.18 0h-.72a.2.2 0 0 0-.2.2v1.87l-2.04-2a.2.2 0 0 0-.15-.07h-.72a.2.2 0 0 0-.2.2v3.15a.2.2 0 0 0 .2.2h.72a.2.2 0 0 0 .2-.2V9.99l2.04 2.02a.2.2 0 0 0 .15.08h.72a.2.2 0 0 0 .2-.2V8.74a.2.2 0 0 0-.2-.2Zm-5.94 2.63H7.14V8.74a.2.2 0 0 0-.2-.2h-.72a.2.2 0 0 0-.2.2v3.15a.2.2 0 0 0 .2.2h2.24a.2.2 0 0 0 .2-.2v-.72a.2.2 0 0 0-.2-.2Zm9.45-2.63h-2.24a.2.2 0 0 0-.2.2v3.15a.2.2 0 0 0 .2.2h2.24a.2.2 0 0 0 .2-.2v-.72a.2.2 0 0 0-.2-.2h-1.52v-.44h1.52a.2.2 0 0 0 .2-.2v-.72a.2.2 0 0 0-.2-.2h-1.52v-.44h1.52a.2.2 0 0 0 .2-.2v-.72a.2.2 0 0 0-.2-.2Z" fill="white"/>
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.47h-2.796v8.385C19.612 22.954 24 17.99 24 12Z" fill="#1877F2"/>
      <path d="m16.671 15.47.532-3.47h-3.328V9.75c0-.949.465-1.874 1.956-1.874h1.513V4.923s-1.374-.235-2.686-.235c-2.741 0-4.533 1.66-4.533 4.668V12H7.078v3.47h3.047v8.385a12.09 12.09 0 0 0 3.75 0V15.47h2.796Z" fill="white"/>
    </svg>
  );
}

// ─── Provider definitions ───────────────────────────────────────────

const PROVIDERS = [
  {
    key: "google",
    name: "Google",
    icon: GoogleIcon,
    description: "Google OAuth 2.0 — สำหรับ Gmail / Google Workspace",
    fields: [
      { key: "clientId", label: "Client ID", placeholder: "xxx.apps.googleusercontent.com" },
      { key: "clientSecret", label: "Client Secret", placeholder: "GOCSPX-xxx", secret: true },
    ],
  },
  {
    key: "microsoft",
    name: "Microsoft Azure AD",
    icon: MicrosoftIcon,
    description: "Microsoft OAuth — สำหรับ Office 365 / Azure AD",
    fields: [
      { key: "clientId", label: "Application (Client) ID", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
      { key: "clientSecret", label: "Client Secret", placeholder: "xxx", secret: true },
      { key: "tenantId", label: "Directory (Tenant) ID", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx หรือ common" },
    ],
  },
  {
    key: "keycloak",
    name: "Keycloak",
    icon: KeycloakIcon,
    description: "Keycloak SSO — สำหรับ On-premise Identity Provider",
    fields: [
      { key: "issuerUrl", label: "Issuer URL", placeholder: "https://keycloak.example.com/realms/myrealm" },
      { key: "clientId", label: "Client ID", placeholder: "u-exam" },
      { key: "clientSecret", label: "Client Secret", placeholder: "xxx", secret: true },
    ],
  },
  {
    key: "line",
    name: "LINE",
    icon: LineIcon,
    description: "LINE Login — สำหรับผู้ใช้ LINE ในไทย",
    fields: [
      { key: "clientId", label: "Channel ID", placeholder: "1234567890" },
      { key: "clientSecret", label: "Channel Secret", placeholder: "xxx", secret: true },
    ],
  },
  {
    key: "facebook",
    name: "Facebook",
    icon: FacebookIcon,
    description: "Facebook Login — สำหรับ Social Login",
    fields: [
      { key: "clientId", label: "App ID", placeholder: "1234567890" },
      { key: "clientSecret", label: "App Secret", placeholder: "xxx", secret: true },
    ],
  },
] as const;

// ─── Types ──────────────────────────────────────────────────────────

interface ProviderConfig {
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
  issuerUrl?: string;
  hasSecret?: boolean;
}

interface AuthSettings {
  allowCredentialsLogin: boolean;
  allowSelfRegistration: boolean;
  providers: Record<string, ProviderConfig>;
}

// ─── Page ───────────────────────────────────────────────────────────

export default function AuthSettingsPage() {
  const [settings, setSettings] = useState<AuthSettings>({
    allowCredentialsLogin: true,
    allowSelfRegistration: true,
    providers: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/v1/settings/auth")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setSettings(json.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const updateProvider = (key: string, field: string, value: unknown) => {
    setSettings((prev) => ({
      ...prev,
      providers: {
        ...prev.providers,
        [key]: { ...prev.providers[key], [field]: value },
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/v1/settings/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("บันทึกการตั้งค่า OAuth สำเร็จ");
      } else {
        toast.error(json.error?.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ตั้งค่า Authentication</h1>
          <p className="text-sm text-muted-foreground">
            จัดการ OAuth Provider และการเข้าสู่ระบบ
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-1.5">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          บันทึก
        </Button>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            การตั้งค่าทั่วไป
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>อนุญาต Credentials Login</Label>
              <p className="text-xs text-muted-foreground">
                ผู้ใช้สามารถเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน
              </p>
            </div>
            <Switch
              checked={settings.allowCredentialsLogin}
              onCheckedChange={(v) =>
                setSettings((p) => ({ ...p, allowCredentialsLogin: v }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>อนุญาต Self-registration</Label>
              <p className="text-xs text-muted-foreground">
                ผู้ใช้ใหม่สามารถสมัครสมาชิกด้วยตนเอง
              </p>
            </div>
            <Switch
              checked={settings.allowSelfRegistration}
              onCheckedChange={(v) =>
                setSettings((p) => ({ ...p, allowSelfRegistration: v }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* OAuth Providers */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">OAuth Providers</h2>

        {PROVIDERS.map((provider) => {
          const config = settings.providers[provider.key] ?? { enabled: false };
          const isEnabled = config.enabled;

          return (
            <Card key={provider.key} className={isEnabled ? "border-primary/30" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <provider.icon className="h-7 w-7 shrink-0" />
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {provider.name}
                        {isEnabled ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 gap-1 text-xs">
                            <CheckCircle2 className="h-3 w-3" /> เปิดใช้งาน
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <XCircle className="h-3 w-3" /> ปิด
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {provider.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(v) => updateProvider(provider.key, "enabled", v)}
                  />
                </div>
              </CardHeader>

              {isEnabled && (
                <CardContent className="pt-0 space-y-3">
                  <Separator />
                  <div className="grid gap-3 sm:grid-cols-2">
                    {provider.fields.map((field) => (
                      <div key={field.key} className="space-y-1.5">
                        <Label className="text-xs">{field.label}</Label>
                        <div className="relative">
                          <Input
                            type={
                              field.secret && !showSecrets[`${provider.key}-${field.key}`]
                                ? "password"
                                : "text"
                            }
                            value={(config as Record<string, string>)[field.key] ?? ""}
                            onChange={(e) =>
                              updateProvider(provider.key, field.key, e.target.value)
                            }
                            placeholder={field.placeholder}
                            className="text-sm pr-10"
                          />
                          {field.secret && (
                            <button
                              type="button"
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              onClick={() =>
                                setShowSecrets((p) => ({
                                  ...p,
                                  [`${provider.key}-${field.key}`]:
                                    !p[`${provider.key}-${field.key}`],
                                }))
                              }
                            >
                              {showSecrets[`${provider.key}-${field.key}`] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {provider.key === "google" && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Redirect URI: <code className="bg-muted px-1 py-0.5 rounded text-xs">
                        {typeof window !== "undefined" ? window.location.origin : ""}/api/auth/callback/google
                      </code>
                    </p>
                  )}
                  {provider.key === "microsoft" && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Redirect URI: <code className="bg-muted px-1 py-0.5 rounded text-xs">
                        {typeof window !== "undefined" ? window.location.origin : ""}/api/auth/callback/azure-ad
                      </code>
                    </p>
                  )}
                  {provider.key === "keycloak" && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Redirect URI: <code className="bg-muted px-1 py-0.5 rounded text-xs">
                        {typeof window !== "undefined" ? window.location.origin : ""}/api/auth/callback/keycloak
                      </code>
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
