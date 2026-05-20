"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Plus, X } from "lucide-react";
import { useTranslation, type TranslationKey } from "@/lib/i18n";

const CATEGORIES = ["CLOTHING", "SOCKS", "EQUIPMENT", "OTHER"] as const;
const CATEGORY_KEYS: Record<string, TranslationKey> = {
  CLOTHING: "category_clothing",
  SOCKS: "category_socks",
  EQUIPMENT: "category_equipment",
  OTHER: "category_other",
};

interface MerchItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  stock: number;
  sizes: string | null;
  isActive: boolean;
  image: string | null;
}

export function MerchandiseManager({ items: initialItems }: { items: MerchItem[] }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "CLOTHING",
    price: "",
    stock: "0",
    sizes: "",
    isActive: true,
  });

  function resetForm() {
    setForm({ name: "", description: "", category: "CLOTHING", price: "", stock: "0", sizes: "", isActive: true });
    setEditId(null);
    setShowForm(false);
  }

  function startEdit(item: MerchItem) {
    setForm({
      name: item.name,
      description: item.description ?? "",
      category: item.category,
      price: String(item.price),
      stock: String(item.stock),
      sizes: item.sizes ?? "",
      isActive: item.isActive,
    });
    setEditId(item.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price) return;
    setLoading(true);

    try {
      const method = editId ? "PATCH" : "POST";
      const body = editId
        ? { id: editId, ...form }
        : form;

      const res = await fetch("/api/merchandise", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        resetForm();
        router.refresh();
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {/* Items grid */}
      {initialItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="mx-auto mb-4 h-10 w-10" style={{ color: "var(--muted-foreground)" }} />
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {t("no_merchandise")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {initialItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      {item.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {item.category} {item.sizes && `· ${item.sizes}`}
                    </p>
                  </div>
                  <span
                    className="rounded px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: item.isActive ? "rgba(255,255,255,0.1)" : "rgba(239,68,68,0.1)",
                      color: item.isActive ? "var(--foreground)" : "#f87171",
                    }}
                  >
                    {item.isActive ? t("active") : t("inactive")}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
                      {item.price.toFixed(3)} KWD
                    </span>
                    <span className="ml-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {t("stock")}: {item.stock}
                    </span>
                  </div>
                  <button
                    onClick={() => startEdit(item)}
                    className="rounded-md border px-2.5 py-1 text-xs font-medium"
                    style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                  >
                    {t("edit")}
                  </button>
                </div>
                {item.description && (
                  <p className="mt-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {item.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          <Plus className="h-4 w-4" /> {t("add_merchandise")}
        </button>
      ) : (
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                {editId ? t("edit_item") : t("new_item")}
              </h3>
              <button onClick={resetForm}>
                <X className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                  {t("name")} *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                  {t("category")} *
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{t(CATEGORY_KEYS[c])}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                  {t("price")} (KWD) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                  {t("stock")}
                </label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                  {t("sizes")}
                </label>
                <input
                  value={form.sizes}
                  onChange={(e) => setForm({ ...form, sizes: e.target.value })}
                  placeholder="S,M,L,XL"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                  {t("description")}
                </label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
                />
              </div>

              <div className="flex items-center gap-2 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  {t("active")}
                </label>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md px-6 py-2 text-sm font-medium disabled:opacity-50"
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                >
                  {loading ? t("saving") : editId ? t("update") : t("create")}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
