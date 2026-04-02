"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Plus, 
  MapPin, 
  Trash2, 
  Loader2, 
  AlertTriangle, 
  Building2, 
  ExternalLink,
  Pencil,
  X,
  Check
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { api, Location, UserSettings } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function LocationsPage() {
  const { getToken } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [locName, setLocName] = useState("");
  const [locAddress, setLocAddress] = useState("");
  
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      
      const [s, l] = await Promise.all([
        api.getSettings(token),
        api.getLocations(token)
      ]);
      
      setSettings(s);
      setLocations(l);
    } catch (err) {
      console.error("Failed to fetch locations:", err);
      setError("Failed to load locations.");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setLocName("");
    setLocAddress("");
  };

  const handleStartEdit = (loc: Location) => {
    setEditingId(loc.id);
    setIsAdding(false);
    setLocName(loc.name);
    setLocAddress(loc.address || "");
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setLocName("");
    setLocAddress("");
  };

  const handleSave = async () => {
    if (!locName.trim()) return;
    setError("");
    const procId = editingId || "adding";
    setProcessingId(procId);
    
    try {
      const token = await getToken();
      if (!token) return;
      
      if (editingId) {
        const updated = await api.updateLocation(token, editingId, {
          name: locName,
          address: locAddress
        });
        setLocations(locations.map(l => l.id === editingId ? updated : l));
      } else {
        const newLoc = await api.createLocation(token, {
          name: locName,
          address: locAddress
        });
        setLocations([...locations, newLoc]);
      }
      
      handleCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save location");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm("Are you sure? All historical invoices linked to this location will remain, but you won't be able to filter by this location anymore.")) return;
    
    setProcessingId(id);
    try {
      const token = await getToken();
      if (!token) return;
      
      await api.deleteLocation(token, id);
      setLocations(locations.filter(l => l.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete location");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
        <p className="text-muted-foreground">Loading locations…</p>
      </div>
    );
  }

  const tier = settings?.tier || "free";
  const limit = tier === "multi" ? 5 : 1;
  const atLimit = locations.length >= limit;

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Restaurant Locations</h1>
          <p className="text-muted-foreground">Manage the physical sites monitored by PriceShield.</p>
        </div>
        {!isAdding && !editingId && !atLimit && (
          <Button onClick={handleStartAdd} className="bg-emerald-500 hover:bg-emerald-400 text-background">
            <Plus className="h-4 w-4 mr-2" /> Add Location
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {(isAdding || editingId) && (
        <Card className="border-emerald-500/30 bg-emerald-500/5 animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader>
            <CardTitle className="text-lg">{editingId ? "Edit Location" : "Add New Location"}</CardTitle>
            <CardDescription>Enter the details for your restaurant site.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Location Name</label>
                <input
                  type="text"
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  placeholder="e.g. Downtown Bistro"
                  className="w-full rounded-lg border border-border/50 bg-background/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Address (Important for Multi-Audit)</label>
                <input
                  type="text"
                  value={locAddress}
                  onChange={(e) => setLocAddress(e.target.value)}
                  placeholder="123 Main St, City"
                  className="w-full rounded-lg border border-border/50 bg-background/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t border-border/20 pt-4">
            <Button variant="ghost" onClick={handleCancel} disabled={!!processingId}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!!processingId || !locName.trim()}
              className="bg-emerald-500 hover:bg-emerald-400 text-background font-semibold"
            >
              {processingId === "adding" || (editingId && processingId === editingId) ? (
                <Loader2 className="h-4 w-4 animate-spin" /> 
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {editingId ? "Update Location" : "Save Location"}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {atLimit && !isAdding && !editingId && tier !== "multi" && (
        <div className="p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Building2 className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-lg">Manage Multiple Locations</p>
              <p className="text-sm text-muted-foreground">The {tier} tier is limited to 1 location. Upgrade to Multi-Location to manage up to 5 sites.</p>
            </div>
          </div>
          <a href="/dashboard/billing">
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-background whitespace-nowrap">
              Upgrade Now <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {locations.map((loc) => (
          <Card key={loc.id} className={cn(
            "group transition-all duration-300",
            editingId === loc.id ? "border-emerald-500 ring-1 ring-emerald-500/20" : "hover:border-emerald-500/30"
          )}>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                  <MapPin className="h-5 w-5 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleStartEdit(loc)}
                    disabled={!!processingId}
                    className="text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {locations.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteLocation(loc.id)}
                      disabled={processingId === loc.id}
                      className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      {processingId === loc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
              <CardTitle className="mt-4">{loc.name}</CardTitle>
              <CardDescription className={cn(
                "flex items-center gap-1.5 mt-1 font-medium",
                !loc.address && "text-rose-400/70"
              )}>
                {loc.address || "No address provided"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50">
                <span>Created {new Date(loc.created_at).toLocaleDateString()}</span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                <span>ID: {loc.id}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
