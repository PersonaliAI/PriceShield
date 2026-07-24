"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChefHat,
  Plus,
  X,
  ArrowRight,
  Sparkles,
  DollarSign,
  Percent,
  TrendingDown,
  UtensilsCrossed,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Ingredient {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
}

const UNITS = ["oz", "lb", "kg", "g", "ea", "cup", "tbsp", "tsp", "ml", "L"];

let nextId = 4;

const defaultIngredients: Ingredient[] = [
  { id: 1, name: "Chicken Breast", quantity: 2, unit: "lb", unitCost: 3.99 },
  { id: 2, name: "Olive Oil", quantity: 3, unit: "tbsp", unitCost: 0.15 },
  { id: 3, name: "Garlic", quantity: 4, unit: "ea", unitCost: 0.12 },
];

export function FoodCostClient() {
  const [recipeName, setRecipeName] = useState("Grilled Chicken");
  const [servings, setServings] = useState(4);
  const [ingredients, setIngredients] =
    useState<Ingredient[]>(defaultIngredients);
  const [targetFoodCost, setTargetFoodCost] = useState(30);

  // ── Calculations ─────────────────────────────────────
  const totalRecipeCost = ingredients.reduce(
    (sum, ing) => sum + ing.quantity * ing.unitCost,
    0,
  );
  const costPerServing = servings > 0 ? totalRecipeCost / servings : 0;
  const recommendedPrice =
    targetFoodCost > 0 ? costPerServing / (targetFoodCost / 100) : 0;
  const profitPerServing = recommendedPrice - costPerServing;
  const actualFoodCostPct =
    recommendedPrice > 0 ? (costPerServing / recommendedPrice) * 100 : 0;

  // ── Ingredient handlers ──────────────────────────────
  const updateIngredient = (
    id: number,
    field: keyof Ingredient,
    value: string | number,
  ) => {
    setIngredients((prev) =>
      prev.map((ing) => (ing.id === id ? { ...ing, [field]: value } : ing)),
    );
  };

  const addIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      { id: nextId++, name: "", quantity: 1, unit: "oz", unitCost: 0 },
    ]);
  };

  const removeIngredient = (id: number) => {
    setIngredients((prev) => prev.filter((ing) => ing.id !== id));
  };

  // ── Benchmark helper ─────────────────────────────────
  const benchmarks = [
    { label: "Fast Food", min: 25, max: 30 },
    { label: "Casual Dining", min: 28, max: 35 },
    { label: "Fine Dining", min: 30, max: 40 },
  ];

  const markerPosition = ((targetFoodCost - 20) / (45 - 20)) * 100;

  return (
    <div className="space-y-12">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs font-semibold">
          <Sparkles className="size-3.5" />
          <span>Interactive Food Cost Calculator</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
          Calculate Your Recipe&apos;s{" "}
          <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400 bg-clip-text text-transparent">
            True Food Cost.
          </span>
        </h1>
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
          Build your recipe, see your cost per serving, and find the ideal menu
          price to hit your target food cost percentage.
        </p>
      </div>

      {/* Main Grid: Inputs and Output Results */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start min-w-0 w-full max-w-full">
        {/* ─── Left Side: Inputs ─── */}
        <div className="md:col-span-7 space-y-6 w-full min-w-0">
          {/* Section 1: Recipe Details */}
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ChefHat className="size-5 text-emerald-400" />
              1. Recipe Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="recipe-name"
                  className="text-xs font-semibold text-muted-foreground"
                >
                  Recipe Name
                </label>
                <input
                  id="recipe-name"
                  type="text"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  placeholder="e.g. Grilled Chicken"
                  className="w-full rounded-lg border border-border bg-muted/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="servings"
                  className="text-xs font-semibold text-muted-foreground"
                >
                  Number of Servings
                </label>
                <input
                  id="servings"
                  type="number"
                  min={1}
                  value={servings}
                  onChange={(e) =>
                    setServings(Math.max(1, Number(e.target.value)))
                  }
                  className="w-full rounded-lg border border-border bg-muted/60 px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Ingredients */}
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Scale className="size-5 text-emerald-400" />
                2. Ingredients
              </h2>
              <span className="text-xs text-muted-foreground font-mono">
                {ingredients.length} item{ingredients.length !== 1 && "s"}
              </span>
            </div>

            {/* Column Headers (desktop) */}
            <div className="hidden sm:grid sm:grid-cols-[1fr_80px_90px_100px_32px] gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
              <span>Ingredient</span>
              <span>Qty</span>
              <span>Unit</span>
              <span>Unit Cost</span>
              <span></span>
            </div>

            {/* Ingredient Rows */}
            <div className="space-y-2">
              {ingredients.map((ing) => (
                <div
                  key={ing.id}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_80px_90px_100px_32px] gap-2 items-center rounded-lg border border-border/60 bg-muted/30 p-2 sm:p-1.5"
                >
                  {/* Name */}
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) =>
                      updateIngredient(ing.id, "name", e.target.value)
                    }
                    placeholder="Ingredient name"
                    className="w-full rounded-md border border-border bg-muted/60 px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  />
                  {/* Quantity */}
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={ing.quantity}
                    onChange={(e) =>
                      updateIngredient(
                        ing.id,
                        "quantity",
                        Math.max(0, Number(e.target.value)),
                      )
                    }
                    className="w-full rounded-md border border-border bg-muted/60 px-2.5 py-1.5 text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  />
                  {/* Unit */}
                  <select
                    value={ing.unit}
                    onChange={(e) =>
                      updateIngredient(ing.id, "unit", e.target.value)
                    }
                    className="w-full rounded-md border border-border bg-muted/60 px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/50 appearance-none cursor-pointer"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  {/* Unit Cost */}
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={ing.unitCost}
                      onChange={(e) =>
                        updateIngredient(
                          ing.id,
                          "unitCost",
                          Math.max(0, Number(e.target.value)),
                        )
                      }
                      className="w-full rounded-md border border-border bg-muted/60 pl-6 pr-2.5 py-1.5 text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>
                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeIngredient(ing.id)}
                    className="flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    aria-label={`Remove ${ing.name}`}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addIngredient}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer mt-1"
            >
              <Plus className="size-3.5" />
              Add Ingredient
            </button>
          </div>

          {/* Section 3: Target Food Cost Slider */}
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Percent className="size-5 text-emerald-400" />
              3. Menu Pricing Target
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <label
                  htmlFor="target-food-cost"
                  className="text-muted-foreground"
                >
                  Target Food Cost %
                </label>
                <span className="text-emerald-400 font-mono text-sm">
                  {targetFoodCost}%
                </span>
              </div>
              <input
                id="target-food-cost"
                type="range"
                min={20}
                max={45}
                step={1}
                value={targetFoodCost}
                onChange={(e) => setTargetFoodCost(Number(e.target.value))}
                className="w-full h-1.5 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>20%</span>
                <span>30%</span>
                <span>45%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Right Side: Outputs ─── */}
        <div className="md:col-span-5 space-y-6 w-full min-w-0">
          {/* Main Results Card */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity" />
            <div className="relative rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
              {/* Total Recipe Cost */}
              <div className="text-center pb-4 border-b border-border/60">
                <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                  Total Recipe Cost
                </span>
                <div className="text-4xl md:text-5xl font-mono font-bold text-emerald-400 mt-2">
                  $
                  {totalRecipeCost.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {recipeName || "Recipe"} · {servings} serving
                  {servings !== 1 && "s"}
                </p>
              </div>

              {/* Detail Metrics */}
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-teal-400" />
                    Cost Per Serving:
                  </span>
                  <span className="text-foreground font-mono font-semibold">
                    $
                    {costPerServing.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-400" />
                    Food Cost %:
                  </span>
                  <span className="text-emerald-400 font-mono font-semibold">
                    {actualFoodCostPct.toFixed(1)}%
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs border-b border-border/40 pb-3">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-blue-400" />
                    Profit Per Serving:
                  </span>
                  <span className="text-foreground font-mono font-semibold">
                    $
                    {profitPerServing.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm font-bold pt-1">
                  <span className="text-foreground">Recommended Menu Price:</span>
                  <span className="text-emerald-400 font-mono">
                    $
                    {recommendedPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  At {targetFoodCost}% target food cost
                </p>
              </div>

              {/* Industry Benchmark Strip */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Industry Benchmarks
                </span>
                <div className="relative h-5 bg-muted/60 rounded-full overflow-hidden">
                  {/* Benchmark zones */}
                  {benchmarks.map((b, i) => {
                    const left = ((b.min - 20) / (45 - 20)) * 100;
                    const width = ((b.max - b.min) / (45 - 20)) * 100;
                    const colors = [
                      "bg-emerald-500/20",
                      "bg-teal-500/20",
                      "bg-blue-500/20",
                    ];
                    return (
                      <div
                        key={i}
                        className={`absolute top-0 h-full ${colors[i]} rounded-full`}
                        style={{ left: `${left}%`, width: `${width}%` }}
                      />
                    );
                  })}
                  {/* User marker */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-emerald-400 transition-all duration-200"
                    style={{
                      left: `${Math.max(0, Math.min(100, markerPosition))}%`,
                    }}
                  >
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 size-2.5 rounded-full bg-emerald-400 border-2 border-card" />
                  </div>
                </div>
                {/* Benchmark labels */}
                <div className="grid grid-cols-3 gap-1 text-center">
                  {benchmarks.map((b, i) => {
                    const dotColors = [
                      "bg-emerald-400",
                      "bg-teal-400",
                      "bg-blue-400",
                    ];
                    return (
                      <div key={i} className="space-y-0.5">
                        <div className="flex items-center justify-center gap-1">
                          <span
                            className={`size-1.5 rounded-full ${dotColors[i]}`}
                          />
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {b.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-foreground font-mono">
                          {b.min}–{b.max}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PriceShield CTA */}
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center space-y-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Automate With PriceShield
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Track ingredient costs automatically across every invoice.
                  PriceShield alerts you when supplier prices drift up.
                </p>
              </div>

              <Button
                size="lg"
                className="w-full font-semibold cursor-pointer shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500 text-white"
                render={<Link href="/login" />}
              >
                Automate Price Tracking
                <ArrowRight className="size-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Educational / FAQ Cards ─── */}
      <section className="py-8 border-t border-border/60">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6 text-center">
          Understanding Restaurant Food Cost
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <DollarSign className="size-4 text-emerald-400" />
              What is Food Cost Percentage?
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Food cost percentage measures how much of your menu price goes to
              ingredient costs. It&apos;s one of the most important metrics for
              restaurant profitability.
            </p>
            <div className="rounded-lg bg-muted/40 border border-border/40 p-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Formula
              </p>
              <p className="text-xs text-emerald-400 font-mono">
                Food Cost % = (Ingredient Cost ÷ Selling Price) × 100
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <UtensilsCrossed className="size-4 text-teal-400" />
              Industry Benchmarks
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Target food cost percentages vary by restaurant type and service
              model. Higher service levels can support higher food costs due to
              premium pricing.
            </p>
            <ul className="space-y-1.5">
              {[
                { type: "Fast Food / QSR", range: "25 – 30%" },
                { type: "Casual Dining", range: "28 – 35%" },
                { type: "Fine Dining", range: "30 – 40%" },
              ].map((item) => (
                <li
                  key={item.type}
                  className="flex justify-between text-xs border-b border-border/30 pb-1.5 last:border-0 last:pb-0"
                >
                  <span className="text-muted-foreground">{item.type}</span>
                  <span className="text-foreground font-mono">{item.range}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <TrendingDown className="size-4 text-blue-400" />
              How to Lower Food Cost
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Reduce your food cost percentage with these strategies:
            </p>
            <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
              {[
                "Standardise portions & recipes",
                "Audit supplier invoices regularly",
                "Track and reduce food waste",
                "Negotiate volume discounts",
                "Cross-utilise ingredients across menu",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-1.5">
                  <span className="mt-1 size-1 rounded-full bg-blue-400 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
