"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, ArrowRight, Loader2, Check, AlertTriangle, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";

export default function OAuthAuthorizePage() {
  const { user, loading, getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // OAuth query parameters
  const clientId = searchParams.get("client_id");
  const redirectUri = searchParams.get("redirect_uri");
  const state = searchParams.get("state") || "";
  const codeChallenge = searchParams.get("code_challenge");
  const scopes = searchParams.get("scopes") || "";
  const resource = searchParams.get("resource") || "";

  const [authorizing, setAuthorizing] = useState(false);
  const [error, setError] = useState("");
  const [loadingClient, setLoadingClient] = useState(true);
  const [clientMetadata, setClientMetadata] = useState<{
    client_name: string;
    logo_uri?: string;
    client_uri?: string;
  } | null>(null);

  // Fetch client details from MCP server
  useEffect(() => {
    if (!clientId) {
      setError("Missing required OAuth parameter: client_id");
      setLoadingClient(false);
      return;
    }

    const fetchClientDetails = async () => {
      try {
        const mcpServerUrl = process.env.NEXT_PUBLIC_MCP_URL || "https://priceshield-mcp-647257091960.us-central1.run.app";
        const response = await fetch(`${mcpServerUrl}/authorize/client-details?client_id=${clientId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("The requesting application is not registered or was not found.");
          }
          throw new Error("Failed to load requesting application details.");
        }
        const data = await response.json();
        setClientMetadata(data);
      } catch (err: any) {
        console.error("Error fetching client details:", err);
        setError(err.message || "Could not retrieve integration details.");
      } finally {
        setLoadingClient(false);
      }
    };

    fetchClientDetails();
  }, [clientId]);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!loading && !user) {
      const currentPath = window.location.pathname + window.location.search;
      router.replace(`/login?next=${encodeURIComponent(currentPath)}`);
    }
  }, [loading, user, router]);

  if (loading || (loadingClient && !error) || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground space-y-4">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-muted-foreground">
          {loading ? "Verifying session..." : "Fetching connection details..."}
        </p>
      </div>
    );
  }

  const handleCancel = () => {
    if (redirectUri) {
      const cancelUrl = new URL(redirectUri);
      cancelUrl.searchParams.set("error", "access_denied");
      if (state) {
        cancelUrl.searchParams.set("state", state);
      }
      window.location.href = cancelUrl.toString();
    } else {
      router.push("/dashboard");
    }
  };

  const handleGrantAccess = async () => {
    if (!clientId || !redirectUri || !codeChallenge) {
      setError("Missing required OAuth parameters (client_id, redirect_uri, code_challenge)");
      return;
    }

    setError("");
    setAuthorizing(true);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Unable to retrieve Supabase authentication token");
      }

      const mcpServerUrl = process.env.NEXT_PUBLIC_MCP_URL || "https://priceshield-mcp-647257091960.us-central1.run.app";
      const response = await fetch(`${mcpServerUrl}/authorize/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          client_id: clientId,
          redirect_uri: redirectUri,
          state,
          code_challenge: codeChallenge,
          scopes,
          resource,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to confirm authorization");
      }

      const data = await response.json();
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        throw new Error("Invalid response from authorization server");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during authorization.");
      setAuthorizing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-purple-500/5 blur-3xl animate-pulse-glow [animation-delay:1.5s]" />
      </div>

      <Card className="w-full max-w-lg bg-card/80 backdrop-blur border-border shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-4">
          <div className="flex items-center justify-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-950/20">
              <Shield className="h-7 w-7 text-emerald-400" />
            </div>
            <div className="flex items-center text-muted-foreground/60 gap-1.5 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/70" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80" />
            </div>
            <div className="h-14 w-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-lg shadow-purple-950/20 overflow-hidden shrink-0">
              {clientMetadata?.logo_uri ? (
                <img
                  src={clientMetadata.logo_uri}
                  alt={clientMetadata.client_name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <Cpu className="h-7 w-7 text-purple-400" />
              )}
            </div>
          </div>
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">
              Connect PriceShield to {clientMetadata?.client_name || "Application"}
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs mt-1.5">
              {clientMetadata?.client_name || "The application"} is requesting permission to access your PriceShield invoice database.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          {error && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-400">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              This connector will allow {clientMetadata?.client_name || "the application"} to:
            </p>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-foreground/90">Read and Query Invoices</p>
                  <p className="text-muted-foreground mt-0.5">Retrieve list of invoices, vendor names, invoice dates, and baseline details.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-foreground/90">Track Supplier Prices & Trends</p>
                  <p className="text-muted-foreground mt-0.5">Audit item unit prices, quantities, and check historical price trends over time.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-foreground/90">Search Product Catalogs</p>
                  <p className="text-muted-foreground mt-0.5">Search catalog products and compare market competitor prices.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4 text-center">
            <p className="text-[11px] text-muted-foreground font-medium">
              Authorizing as: <span className="text-foreground/90 font-bold">{user.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={authorizing}
              className="flex-1 h-11 border-border hover:bg-muted hover:text-foreground text-muted-foreground text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGrantAccess}
              disabled={authorizing || !clientMetadata}
              className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center"
            >
              {authorizing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Grant Access <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
