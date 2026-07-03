"use client";
import { useState } from "react";
import { StockItem } from "@/types";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { MetricCard }   from "@/components/molecules/MetricCard";
import { Badge }        from "@/components/atoms/Badge";
import { Button }       from "@/components/atoms/Button";
import { Input }        from "@/components/atoms/Input";
const SB: Record<string,"red"|"amber"|"green"> = { Critical:"red", Low:"amber", Good:"green" };
interface InventoryPageProps {
  stockItems:   StockItem[];
  onStockChange: (items: StockItem[]) => void;
}
interface EditModalProps {
  item: StockItem;
  onSave: (updated: StockItem) => void;
  onClose: () => void;
}
function deriveStatus(stock: number, reorderAt: string): StockItem["status"] {
  const reorderNum = parseFloat(reorderAt);
  if (isNaN(reorderNum)) return "Good";
  if (stock <= reorderNum * 0.4) return "Critical";
  if (stock <= reorderNum) return "Low";
  return "Good";
}
function deriveFill(stock: number, reorderAt: string): number {
  const reorderNum = parseFloat(reorderAt);
  if (isNaN(reorderNum) || reorderNum === 0) return 90;
  const pct = Math.round((stock / (reorderNum * 2)) * 100);
  return Math.min(100, Math.max(5, pct));
}
function EditModal({ item, onSave, onClose }: EditModalProps) {
  const [name,      setName]      = useState(item.name);
  const [category,  setCategory]  = useState(item.category);
  const [stock,     setStock]     = useState(String(item.stock));
  const [unit,      setUnit]      = useState(item.unit);
  const [reorderAt, setReorderAt] = useState(item.reorderAt);
  const [errors,    setErrors]    = useState<Record<string,string>>({});
  const validate = () => {
    const e: Record<string,string> = {};
    if (!name.trim())     e.name  = "Name is required";
    if (!category.trim()) e.cat   = "Category is required";
    if (isNaN(Number(stock)) || stock.trim() === "") e.stock = "Enter a valid number";
    if (!unit.trim())     e.unit  = "Unit is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const handleSave = () => {
    if (!validate()) return;
    const stockNum = Number(stock);
    const updated: StockItem = {
      name:      name.trim(),
      category:  category.trim(),
      stock:     stockNum,
      unit:      unit.trim(),
      reorderAt: reorderAt.trim(),
      status:    deriveStatus(stockNum, reorderAt),
      fillPercent: deriveFill(stockNum, reorderAt),
    };
    onSave(updated);
    onClose();
  };
  const Field = ({ label, value, onChange, err, placeholder, type="text" }: {
    label: string; value: string; onChange: (v: string)=>void;
    err?: string; placeholder?: string; type?: string;
  }) => (
    <div>
      <label className="block mb-1" style={{fontSize:12,color:"var(--c-muted)"}}>{label}</label>
      <Input
        value={value}
        type={type}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full"
      />
      {err && <div style={{fontSize:11,color:"var(--c-red)",marginTop:2}}>{err}</div>}
    </div>
  );
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{maxWidth:440}} onClick={e=>e.stopPropagation()}>
        <div className="modal-box__head">
          <div className="modal-box__title">Edit Stock Item</div>
          <button className="modal-box__close" onClick={onClose}><i className="ti ti-x"/></button>
        </div>
        <div className="flex flex-col gap-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Item Name *"  value={name}     onChange={setName}     err={errors.name} placeholder="e.g. Oat Milk"/>
            <Field label="Category *"   value={category} onChange={setCategory} err={errors.cat}  placeholder="e.g. Dairy Alt"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stock *"      value={stock}    onChange={setStock}    err={errors.stock} placeholder="e.g. 5" type="number"/>
            <Field label="Unit *"       value={unit}     onChange={setUnit}     err={errors.unit}  placeholder="e.g. kg, pcs, L"/>
          </div>
          <Field label="Reorder At"     value={reorderAt} onChange={setReorderAt} placeholder="e.g. 2 kg"/>
          <div style={{padding:"10px 12px",borderRadius:8,background:"rgba(200,135,74,0.08)",border:"1px solid rgba(200,135,74,0.15)",fontSize:12,color:"var(--c-muted)"}}>
            <i className="ti ti-info-circle mr-1" style={{color:"var(--c-c200)"}}/>
            Status will be auto-calculated from stock vs reorder level
          </div>
          <div className="flex gap-2 mt-1">
            <Button variant="tab" className="flex-1 justify-center" onClick={onClose}>Cancel</Button>
            <Button variant="brew" className="flex-1 justify-center" onClick={handleSave}>
              <i className="ti ti-device-floppy mr-1"/>Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
function AddModal({ onSave, onClose }: { onSave: (item: StockItem) => void; onClose: () => void }) {
  const empty: StockItem = { name:"", category:"", stock:0, unit:"", reorderAt:"", status:"Good", fillPercent:90 };
  return <EditModal item={empty} onSave={onSave} onClose={onClose}/>;
}
function DeleteConfirm({ item, onConfirm, onClose }: { item: StockItem; onConfirm:()=>void; onClose:()=>void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{maxWidth:380}} onClick={e=>e.stopPropagation()}>
        <div className="modal-box__head">
          <div className="modal-box__title">Delete Item</div>
          <button className="modal-box__close" onClick={onClose}><i className="ti ti-x"/></button>
        </div>
        <div style={{color:"var(--c-muted)",fontSize:14,marginBottom:20}}>
          Are you sure you want to remove <strong style={{color:"var(--c-cream)"}}>{item.name}</strong> from inventory? This cannot be undone.
        </div>
        <div className="flex gap-2">
          <Button variant="tab" className="flex-1 justify-center" onClick={onClose}>Cancel</Button>
          <Button variant="brew" className="flex-1 justify-center" onClick={onConfirm}
            style={{background:"rgba(226,75,74,0.2)",borderColor:"rgba(226,75,74,0.4)",color:"var(--c-red)"}}>
            <i className="ti ti-trash mr-1"/>Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
export function InventoryPage({ stockItems, onStockChange }: InventoryPageProps) {
  const [editItem,   setEditItem]   = useState<StockItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<StockItem | null>(null);
  const [showAdd,    setShowAdd]    = useState(false);
  const handleEdit = (updated: StockItem) => {
    onStockChange(stockItems.map((s, i) => i === stockItems.indexOf(editItem!) ? updated : s));
  };
  const handleDelete = () => {
    const idx = stockItems.indexOf(deleteItem!);
    onStockChange(stockItems.filter((_, i) => i !== idx));
    setDeleteItem(null);
  };
  const handleAdd = (item: StockItem) => {
    onStockChange([...stockItems, item]);
  };
  const criticalCount = stockItems.filter(s => s.status === "Critical").length;
  return (
    <div className="animate-page-enter">
      <SectionTitle>Inventory</SectionTitle>
      {editItem   && <EditModal item={editItem}   onSave={handleEdit}   onClose={() => setEditItem(null)}/>}
      {deleteItem && <DeleteConfirm item={deleteItem} onConfirm={handleDelete} onClose={() => setDeleteItem(null)}/>}
      {showAdd    && <AddModal onSave={handleAdd} onClose={() => setShowAdd(false)}/>}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <MetricCard label="Total Items"    value={String(stockItems.length)} delay={0.05}/>
        <MetricCard label="Critical Alerts" value={String(criticalCount)}   deltaType="down" delay={0.1}/>
        <MetricCard label="Stock Value"    value="₹42,600" delay={0.15}/>
      </div>
      <div className="card">
        <div className="flex justify-end gap-2.5 mb-4">
          <Button variant="tab"><i className="ti ti-download mr-1"/>Export</Button>
          <Button variant="brew-sm" onClick={() => setShowAdd(true)}>
            <i className="ti ti-plus mr-1"/>Add Item
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table" style={{minWidth:600}}>
            <thead>
              <tr>
                <th>Item</th><th>Category</th><th>Stock</th>
                <th>Unit</th><th>Reorder At</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stockItems.length === 0 && (
                <tr><td colSpan={7} style={{textAlign:"center",padding:"32px 0",color:"var(--c-cream)"}}>
                  <i className="ti ti-box-off" style={{fontSize:28,display:"block",marginBottom:6}}/>
                  No items in inventory
                </td></tr>
              )}
              {stockItems.map(s => (
                <tr key={s.name}>
                  <td style={{color:"var(--c-cream)",fontWeight:500}}>{s.name}</td>
                  <td>{s.category}</td>
                  <td style={{color: s.status === "Critical" ? "var(--c-red)" : s.status === "Low" ? "var(--c-amber)" : "var(--c-green)", fontWeight:600}}>
                    {s.stock}
                  </td>
                  <td>{s.unit}</td>
                  <td>{s.reorderAt}</td>
                  <td><Badge variant={SB[s.status]}>{s.status}</Badge></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditItem(s)}
                        title="Edit item"
                        style={{padding:"5px 10px", borderRadius:6, fontSize:12, cursor:"pointer", background:"rgba(200,135,74,0.12)", color:"var(--c-c200)", border:"1px solid rgba(200,135,74,0.25)", display:"flex", alignItems:"center", gap:4,}}>
                        <i className="ti ti-pencil" style={{fontSize:13}}/>Edit
                      </button>
                      <button
                        onClick={() => setDeleteItem(s)}
                        title="Delete item"
                        style={{padding:"5px 10px", borderRadius:6, fontSize:12, cursor:"pointer", background:"rgba(226,75,74,0.10)", color:"var(--c-red)",border:"1px solid rgba(226,75,74,0.25)", display:"flex", alignItems:"center", gap:4,}}>
                        <i className="ti ti-trash" style={{fontSize:13}}/>Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}