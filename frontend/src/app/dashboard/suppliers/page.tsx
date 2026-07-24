"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Truck, 
  Search, 
  Pencil, 
  Trash2, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle, 
  X,
  Plus,
  ArrowLeft,
  Loader2,
  Trash,
  Shield
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function SuppliersPage() {
  const { getToken } = useAuth();
  const [baselines, setBaselines] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Edit State
  const [editingItem, setEditingItem] = useState<{ vendor: string; name: string; data: any } | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editSku, setEditSku] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deleteConfirm, setDeleteConfirm] = useState<{ vendor: string; name?: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const data = await api.getBaselines(token);
      setBaselines(data);
    } catch (err) {
      console.error("Failed to fetch baselines:", err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const vendors = Object.keys(baselines).filter(v => v.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleUpdate = async () => {
    if (!editingItem) return;
    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) return;
      await api.updateBaselineItem(token, editingItem.vendor, editingItem.name, {
        unit_price: parseFloat(editPrice),
        sku: editSku,
        unit_of_measure: editingItem.data.unit_of_measure
      });
      await fetchData();
      setEditingItem(null);
    } catch (err) {
      console.error("Update failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const token = await getToken();
      if (!token) return;
      if (deleteConfirm.name) {
        await api.deleteBaselineItem(token, deleteConfirm.vendor, deleteConfirm.name);
      } else {
        await api.deleteVendorBaseline(token, deleteConfirm.vendor);
        setSelectedVendor(null);
      }
      await fetchData();
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (loading && Object.keys(baselines).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
        <p className="text-muted-foreground animate-pulse">Loading supplier baselines...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">Suppliers & Baselines</h1>
          <p className="text-muted-foreground max-w-xl">
            Manage your AI-detected price baselines. Correct extractions, update unit prices, or remove outdated vendors.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Vendor List */}
        <Card className="lg:col-span-4 border-border bg-card/80 backdrop-blur-xl h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5 text-emerald-400" /> All Suppliers
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Filter vendors..." 
                className="pl-9 bg-muted/40 border-border" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 p-2">
            {vendors.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground italic">No suppliers found.</p>
            ) : (
              vendors.map(v => (
                <button
                  key={v}
                  onClick={() => setSelectedVendor(v)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-all ${
                    selectedVendor === v 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px] font-black uppercase text-emerald-500 font-mono">
                        {v.substring(0, 2)}
                    </div>
                    {v}
                  </div>
                  <ChevronRight className={`h-4 w-4 transition-transform ${selectedVendor === v ? "rotate-90" : ""}`} />
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Item Details */}
        <Card className="lg:col-span-8 border-border bg-card/80 backdrop-blur-xl min-h-[500px]">
          {!selectedVendor ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Shield className="h-8 w-8 text-emerald-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-medium text-foreground">No Supplier Selected</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Select a supplier from the sidebar to view and manage their price baseline.
                </p>
              </div>
            </div>
          ) : (
            <>
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-6">
                <div className="space-y-1">
                  <Badge variant="outline" className="text-emerald-400 border-emerald-400/20 bg-emerald-400/5 mb-1 uppercase tracking-widest text-[10px]">Active Baseline</Badge>
                  <CardTitle className="text-2xl text-foreground">{selectedVendor}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-400/10"
                        onClick={() => setDeleteConfirm({ vendor: selectedVendor })}
                    >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete All
                    </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted">
                      <tr>
                        <th className="px-6 py-4 font-bold">Item Name</th>
                        <th className="px-6 py-4 font-bold">SKU</th>
                        <th className="px-6 py-4 font-bold text-center">Base Price</th>
                        <th className="px-6 py-4 font-bold text-center">Unit</th>
                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {Object.entries(baselines[selectedVendor] || {})
                        .filter(([name]) => !name.startsWith("_"))
                        .map(([name, data]: [string, any]) => (
                        <tr key={name} className="hover:bg-foreground/[0.02] transition-colors group">
                          <td className="px-6 py-4 font-medium text-foreground/90 max-w-[200px] truncate">{name}</td>
                          <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{data.sku || "N/A"}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-emerald-400 font-bold">
                                ${typeof data.unit_price === 'number' ? data.unit_price.toFixed(2) : "0.00"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-muted-foreground/60">{data.unit_of_measure || "each"}</td>
                          <td className="px-6 py-4 text-right space-x-1">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                                onClick={() => {
                                    setEditingItem({ vendor: selectedVendor, name, data });
                                    setEditPrice((data.unit_price || 0).toString());
                                    setEditSku(data.sku || "");
                                }}
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                                onClick={() => setDeleteConfirm({ vendor: selectedVendor, name })}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {Object.keys(baselines[selectedVendor] || {}).length === 0 && (
                      <div className="py-20 text-center text-muted-foreground italic">No items in this baseline.</div>
                  )}
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="border-white/10 bg-zinc-950/95 backdrop-blur-3xl shadow-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Baseline Item</DialogTitle>
            <DialogDescription>
              Correct the AI's extraction or manually update the target base price for {editingItem?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Unit Price (USD)</label>
              <Input 
                type="number" 
                step="0.01"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="bg-muted/50 border-border"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">SKU / Catalog #</label>
              <Input 
                value={editSku}
                onChange={(e) => setEditSku(e.target.value)}
                className="bg-muted/50 border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingItem(null)}>Cancel</Button>
            <Button 
                onClick={handleUpdate} 
                disabled={isSaving}
                className="bg-emerald-500 hover:bg-emerald-400 text-background font-bold"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="border-rose-500/20 bg-zinc-950/95 backdrop-blur-3xl shadow-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-rose-400 flex items-center gap-2">
                <Trash2 className="h-5 w-5" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription className="pt-2">
              {deleteConfirm?.name 
                ? `Are you sure you want to remove ${deleteConfirm.name} from ${deleteConfirm.vendor}'s price baseline?`
                : `Are you sure you want to delete the ENTIRE price baseline for ${deleteConfirm?.vendor}? This cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button 
                variant="destructive"
                onClick={handleDelete}
                className="bg-rose-500 hover:bg-rose-600 font-bold"
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
