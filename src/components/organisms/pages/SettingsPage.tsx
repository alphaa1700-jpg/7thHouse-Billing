"use client";
import { useState } from "react";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { Input }        from "@/components/atoms/Input";
import { Button }       from "@/components/atoms/Button";

interface SettingsPageProps {
  onSave?: (message: string) => void;
}

const DEFAULT_CAFE = {
  name:    "7th House Coffee",
  address: "12 Church Street, Bengaluru 560001",
  hours:   "7:00 AM – 10:00 PM",
  phone:   "+91 98765 43210",
};

type NotifKey = "lowStock" | "dailySales" | "newSignups" | "orderAnomalies";

const NOTIF_LABELS: { key: NotifKey; label: string }[] = [
  { key: "lowStock",       label: "Low stock alerts"  },
  { key: "dailySales",     label: "Daily sales report" },
  { key: "newSignups",     label: "New signups"        },
  { key: "orderAnomalies", label: "Order anomalies"    },
];


function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
        background: on ? "var(--c-c200)" : "#3a2510",
        position: "relative", transition: "background 0.2s", flexShrink: 0,
        boxShadow: on ? "0 0 8px rgba(200,135,74,0.4)" : "none",
      }}
      aria-label={on ? "On" : "Off"}
    >
      <span style={{
        display: "block", width: 16, height: 16, borderRadius: "50%",
        background: on ? "#fff" : "var(--c-cream)",
        position: "absolute", top: 3,
        left: on ? 21 : 3,
        transition: "left 0.2s, background 0.2s",
      }}/>
    </button>
  );
}

export function SettingsPage({ onSave }: SettingsPageProps) {
  // ── Café details ──────────────────────────────────────────────────────
  const [cafe, setCafe] = useState(DEFAULT_CAFE);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    onSave?.("✅ Café settings saved successfully");
  };

  // ── Notifications ─────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState<Record<NotifKey, boolean>>({
    lowStock:       true,
    dailySales:     true,
    newSignups:     false,
    orderAnomalies: true,
  });

  const toggleNotif = (key: NotifKey) =>
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }));


  return (
    <div className="animate-page-enter">
      <SectionTitle>Settings</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ── Café Details ── */}
        <div className="card">
          <div className="card__head"><div className="card__title">Café Details</div></div>
          <div className="flex flex-col gap-3.5">
            {([
              ["CAFÉ NAME",  "name",    "e.g. 7th House Coffee"] ,
              ["ADDRESS",    "address", "Street, City, PIN"     ] ,
              ["HOURS",      "hours",   "7:00 AM – 10:00 PM"    ] ,
              ["PHONE",      "phone",   "+91 XXXXX XXXXX"       ] ,
            ] as [string, keyof typeof cafe, string][]).map(([label, field, placeholder]) => (
              <div key={field} className="settings-field">
                <div className="settings-field__label">{label}</div>
                <Input
                  value={cafe[field]}
                  placeholder={placeholder}
                  onChange={e => setCafe(prev => ({ ...prev, [field]: e.target.value }))}
                />
              </div>
            ))}
            <Button
              variant="brew-sm"
              className="w-fit mt-1"
              onClick={handleSave}
            >
              {saved
                ? <><i className="ti ti-circle-check mr-1"/>Saved!</>
                : <><i className="ti ti-check mr-1"/>Save Changes</>
              }
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4">

          {/* ── Notifications ── */}
          <div className="card">
            <div className="card__head"><div className="card__title">Notifications</div></div>
            <div className="flex flex-col gap-3.5">
              {NOTIF_LABELS.map(({ key, label }) => (
                <div key={key} className="flex justify-between items-center" style={{ fontSize:13, fontFamily:"DM Sans,sans-serif" }}>
                  <div>
                    <span style={{ color:"var(--c-muted)" }}>{label}</span>
                    <div style={{ fontSize:11, color: notifs[key] ? "var(--c-green)" : "var(--c-cream)", marginTop:1 }}>
                      {notifs[key] ? "Enabled" : "Disabled"}
                    </div>
                  </div>
                  <Toggle on={notifs[key]} onChange={() => toggleNotif(key)}/>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}