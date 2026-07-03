"use client";
import { useState } from "react";
import { MenuItem } from "@/types";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { Badge }        from "@/components/atoms/Badge";
import { Button }       from "@/components/atoms/Button";
import { Input }        from "@/components/atoms/Input";
const AV: Record<string,"green"|"amber"|"red"> = {
  Available:"green", "Low Stock":"amber", Unavailable:"red"
};
const TABS = ["All","Espresso","Cold","Food"];
const CATEGORIES = ["Espresso","Cold","Specialty","Food"];
const AVAILABILITIES = ["Available","Low Stock","Unavailable"] as const;
interface ModalProps {
  mode: "add" | "edit";
  item?: MenuItem;
  onSave: (item: MenuItem) => void;
  onClose: () => void;
}
const EMPTY: MenuItem = {
  emoji: "☕", name: "", category: "Espresso",
  price: 0, availability: "Available", ordersToday: 0,
};
const EMOJI_OPTIONS = ["☕","🥛","🧊","🍵","⚡","🖤","🥐","🧁","🥪","🍰","🫖","🧃","🍫","🥤","🫙"];
function ItemModal({ mode, item, onSave, onClose }: ModalProps) {
  const [form, setForm] = useState<MenuItem>(item ? { ...item } : { ...EMPTY });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (key: keyof MenuItem, val: unknown) =>
    setForm(prev => ({ ...prev, [key]: val }));
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())   e.name  = "Name is required";
    if (form.price <= 0)     e.price = "Price must be greater than 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const handleSave = () => {
    if (!validate()) return;
    onSave(form);
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-box__head">
          <div className="modal-box__title">
            {mode === "add" ? "Add New Item" : `Edit — ${item?.name}`}
          </div>
          <button className="modal-box__close" onClick={onClose}>
            <i className="ti ti-x" />
          </button>
        </div>
        <div className="modal-box__field">
          <div className="modal-box__label">Icon</div>
          <div className="modal-emoji-grid">
            {EMOJI_OPTIONS.map(e => (
              <button
                key={e}
                className={`modal-emoji-btn ${form.emoji === e ? "modal-emoji-btn--active" : ""}`}
                onClick={() => set("emoji", e)}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <div className="modal-box__field">
          <div className="modal-box__label">Item Name</div>
          <Input
            value={form.name}
            onChange={e => set("name", e.target.value)}
            placeholder="e.g. Hazelnut Latte"
          />
          {errors.name && <div className="modal-box__error">{errors.name}</div>}
        </div>
        <div className="modal-box__row">
          <div className="modal-box__field flex-1">
            <div className="modal-box__label">Category</div>
            <select
              className="input-dark"
              value={form.category}
              onChange={e => set("category", e.target.value)}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="modal-box__field" style={{ width: 110 }}>
            <div className="modal-box__label">Price (₹)</div>
            <Input
              type="number"
              min={0}
              value={form.price || ""}
              onChange={e => set("price", Number(e.target.value))}
              placeholder="150"
            />
            {errors.price && <div className="modal-box__error">{errors.price}</div>}
          </div>
        </div>
        <div className="modal-box__field">
          <div className="modal-box__label">Availability</div>
          <div className="flex gap-2 flex-wrap">
            {AVAILABILITIES.map(a => (
              <button
                key={a}
                className={`btn-tab ${form.availability === a ? "btn-tab--active" : ""}`}
                onClick={() => set("availability", a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <div className="modal-box__preview">
          <div className="modal-box__preview-label">Preview</div>
          <div className="modal-preview-card">
            <span className="modal-preview-card__emoji">{form.emoji}</span>
            <div className="modal-preview-card__name">{form.name || "Item Name"}</div>
            <div className="modal-preview-card__price">₹{form.price || 0}</div>
            <Badge variant={AV[form.availability]}>{form.availability}</Badge>
          </div>
        </div>
        <div className="modal-box__actions">
          <Button variant="tab" onClick={onClose}>Cancel</Button>
          <Button variant="brew" onClick={handleSave}>
            <i className={`ti ${mode === "add" ? "ti-plus" : "ti-check"} mr-1`} />
            {mode === "add" ? "Add to Menu" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
interface MenuPageProps {
  menuItems: MenuItem[];
  onMenuChange: (items: MenuItem[]) => void;
}
export function MenuPage({ menuItems, onMenuChange }: MenuPageProps) {
  const [tab,        setTab]        = useState("All");
  const [modal, setModal] = useState<
    | { mode: "add" }
    | { mode: "edit"; item: MenuItem; index: number }
    | null
  >(null);
  const filtered = tab === "All"
    ? menuItems
    : menuItems.filter(i =>
        tab === "Food"
          ? i.category === "Food"
          : i.category === tab
      );
  const handleAdd = (newItem: MenuItem) => {
    const updated = [...menuItems, { ...newItem, ordersToday: 0 }];
    onMenuChange(updated);
    setModal(null);
  };
  const handleEdit = (updated: MenuItem) => {
    if (modal?.mode !== "edit") return;
    const updatedList = menuItems.map((it, i) =>
      i === modal.index ? updated : it
    );
    onMenuChange(updatedList);
    setModal(null);
  };
  const handleDelete = (index: number) => {
    if (!confirm("Remove this item from the menu?")) return;
    onMenuChange(menuItems.filter((_, i) => i !== index));
  };
  return (
    <>
      <div className="animate-page-enter">
        <SectionTitle>Menu Management</SectionTitle>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div className="flex gap-1.5 flex-wrap">
            {TABS.map(t => (
              <Button key={t} variant={tab === t ? "tab-active" : "tab"} onClick={() => setTab(t)}>
                {t}
              </Button>
            ))}
          </div>
          <Button variant="brew-sm" onClick={() => setModal({ mode: "add" })}>
            <i className="ti ti-plus mr-1" />Add Item
          </Button>
        </div>
        <div className="card">
          <div className="overflow-x-auto">
            <table className="data-table" style={{ minWidth: 580 }}>
              <thead>
                <tr>
                  <th></th><th>Item</th><th>Category</th>
                  <th>Price</th><th>Status</th><th>Today</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const realIndex = menuItems.indexOf(item);
                  return (
                    <tr key={item.name + realIndex}>
                      <td style={{ fontSize: 22 }}>{item.emoji}</td>
                      <td style={{ color: "var(--c-cream)", fontWeight: 500 }}>{item.name}</td>
                      <td>{item.category}</td>
                      <td style={{ color: "var(--c-c200)", fontWeight: 600 }}>₹{item.price}</td>
                      <td><Badge variant={AV[item.availability]}>{item.availability}</Badge></td>
                      <td>
                        {item.trending
                          ? <Badge variant="trend">↑{item.ordersToday}</Badge>
                          : item.hot
                            ? <Badge variant="hot">🔥{item.ordersToday}</Badge>
                            : item.ordersToday}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="tab"
                            style={{ fontSize: 11, padding: "4px 10px" }}
                            onClick={() => setModal({ mode: "edit", item, index: realIndex })}
                          >
                            <i className="ti ti-edit" />
                          </Button>
                          <Button
                            variant="tab"
                            style={{ fontSize: 11, padding: "4px 10px", color: "var(--c-red)", borderColor: "var(--c-red)" }}
                            onClick={() => handleDelete(realIndex)}
                          >
                            <i className="ti ti-trash" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {modal?.mode === "add" && (
        <ItemModal mode="add" onSave={handleAdd} onClose={() => setModal(null)} />
      )}
      {modal?.mode === "edit" && (
        <ItemModal mode="edit" item={modal.item} onSave={handleEdit} onClose={() => setModal(null)} />
      )}
    </>
  );
}