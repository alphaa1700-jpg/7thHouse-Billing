"use client";
import { useState, useRef } from "react";
import type { StaffEntry } from "@/lib/db";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { Avatar }       from "@/components/atoms/Avatar";
import { Badge }        from "@/components/atoms/Badge";
import { Button }       from "@/components/atoms/Button";
import { Input }        from "@/components/atoms/Input";

interface StaffPageProps {
  staffList:     StaffEntry[];
  onStaffChange: (staff: StaffEntry[]) => void;
}

function now():   string { return new Date().toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" }); }
function today(): string { return new Date().toLocaleDateString("en-IN"); }

const COLORS = ["var(--c-c200)","#4472a0","#3B6D11","var(--c-cream)","#993556","#2a7a6a","#7a4a99","#996a2a"];

// ── Add Staff Modal ────────────────────────────────────────────────────────
function AddStaffModal({ onAdd, onClose }: { onAdd:(m:StaffEntry)=>void; onClose:()=>void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [phone,     setPhone]     = useState("");
  const [role,      setRole]      = useState("");
  const [shift,     setShift]     = useState<"Shift A"|"Shift B">("Shift A");
  const [imageUrl,  setImageUrl]  = useState<string | undefined>(undefined);
  const [errors,    setErrors]    = useState<Record<string,string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const validate = () => {
    const e: Record<string,string> = {};
    if (!firstName.trim()) e.firstName = "First name is required";
    if (!lastName.trim())  e.lastName  = "Last name is required";
    if (!role.trim())      e.role      = "Role is required";
    if (phone.trim() && !/^[0-9+\-\s()]{7,15}$/.test(phone.trim()))
      e.phone = "Enter a valid phone number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImageUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const initials = `${firstName.trim()[0]}${lastName.trim()[0]}`.toUpperCase();
    const color    = COLORS[Math.floor(Math.random() * COLORS.length)];
    onAdd({
      initials, name: fullName, firstName: firstName.trim(), lastName: lastName.trim(),
      phone: phone.trim() || undefined, role: role.trim(), shift,
      onDuty: false, color, hoursLog: [], imageUrl,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{maxWidth:440}} onClick={e=>e.stopPropagation()}>
        <div className="modal-box__head">
          <div className="modal-box__title">Add Staff Member</div>
          <button className="modal-box__close" onClick={onClose}><i className="ti ti-x"/></button>
        </div>
        <div className="flex flex-col gap-3 mt-2">

          {/* Photo upload */}
          <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:8}}>
            <div
              onClick={()=>fileRef.current?.click()}
              style={{
                width:76, height:76, borderRadius:"50%", cursor:"pointer", overflow:"hidden",
                border:"2px dashed #3a2510", background:"rgba(30,18,10,0.6)",
                display:"flex", alignItems:"center", justifyContent:"center",
                position:"relative", transition:"border-color 0.2s",
              }}
              onMouseEnter={e=>(e.currentTarget.style.borderColor="var(--c-c200)")}
              onMouseLeave={e=>(e.currentTarget.style.borderColor="#3a2510")}
            >
              {imageUrl
                ? <img src={imageUrl} alt="preview" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                : <i className="ti ti-camera" style={{fontSize:22,color:"var(--c-cream)"}}/>
              }
              {imageUrl && (
                <div style={{
                  position:"absolute", inset:0, background:"rgba(0,0,0,0.45)",
                  display:"flex", alignItems:"center", justifyContent:"center", opacity:0,
                  transition:"opacity 0.2s",
                }}
                  onMouseEnter={e=>(e.currentTarget.style.opacity="1")}
                  onMouseLeave={e=>(e.currentTarget.style.opacity="0")}
                >
                  <i className="ti ti-pencil" style={{fontSize:16,color:"#fff"}}/>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleImageChange}/>
            <span style={{fontSize:11,color:"var(--c-cream)"}}>Upload photo (optional)</span>
          </div>

          {/* First / Last name row */}
          <div className="flex gap-2">
            <div style={{flex:1}}>
              <label className="block mb-1" style={{fontSize:12,color:"var(--c-cream)"}}>First Name *</label>
              <Input value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="Aisha" className="w-full"/>
              {errors.firstName && <div style={{fontSize:11,color:"var(--c-red)",marginTop:3}}>{errors.firstName}</div>}
            </div>
            <div style={{flex:1}}>
              <label className="block mb-1" style={{fontSize:12,color:"var(--c-cream)"}}>Last Name *</label>
              <Input value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Khan" className="w-full"/>
              {errors.lastName && <div style={{fontSize:11,color:"var(--c-red)",marginTop:3}}>{errors.lastName}</div>}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block mb-1" style={{fontSize:12,color:"var(--c-cream)"}}>Phone Number</label>
            <Input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 98765 43210" className="w-full" type="tel"/>
            {errors.phone && <div style={{fontSize:11,color:"var(--c-red)",marginTop:3}}>{errors.phone}</div>}
          </div>

          {/* Role */}
          <div>
            <label className="block mb-1" style={{fontSize:12,color:"var(--c-cream)"}}>Role *</label>
            <Input value={role} onChange={e=>setRole(e.target.value)} placeholder="e.g. Barista, Cashier, Supervisor" className="w-full"/>
            {errors.role && <div style={{fontSize:11,color:"var(--c-red)",marginTop:3}}>{errors.role}</div>}
          </div>

          {/* Shift */}
          <div>
            <label className="block mb-1" style={{fontSize:12,color:"var(--c-cream)"}}>Shift</label>
            <div className="flex gap-2">
              {(["Shift A","Shift B"] as const).map(s => (
                <button key={s} onClick={()=>setShift(s)} style={{
                  flex:1, padding:"8px 0", borderRadius:8, fontSize:13, fontWeight:600,
                  border: shift===s ? "1.5px solid #C8874A" : "1.5px solid #3a2510",
                  background: shift===s ? "rgba(200,135,74,0.15)" : "rgba(30,18,10,0.5)",
                  color: shift===s ? "var(--c-c200)" : "var(--c-muted)", cursor:"pointer",
                }}>{s}</button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <Button variant="tab" className="flex-1 justify-center" onClick={onClose}>Cancel</Button>
            <Button variant="brew" className="flex-1 justify-center" onClick={handleSubmit}>
              <i className="ti ti-user-plus mr-1"/>Add Member
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Edit Staff Modal ───────────────────────────────────────────────────────
function EditStaffModal({ member, onSave, onClose }: {
  member: StaffEntry; onSave:(updated:StaffEntry)=>void; onClose:()=>void;
}) {
  const [name,   setName]   = useState(member.name);
  const [role,   setRole]   = useState(member.role);
  const [shift,  setShift]  = useState<"Shift A"|"Shift B">(member.shift);
  const [errors, setErrors] = useState<Record<string,string>>({});

  const validate = () => {
    const e: Record<string,string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!role.trim()) e.role = "Role is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const initials = name.trim().split(" ").map(w=>w[0].toUpperCase()).slice(0,2).join("");
    onSave({ ...member, name:name.trim(), role:role.trim(), shift, initials });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{maxWidth:420}} onClick={e=>e.stopPropagation()}>
        <div className="modal-box__head">
          <div className="modal-box__title">Edit Staff Member</div>
          <button className="modal-box__close" onClick={onClose}><i className="ti ti-x"/></button>
        </div>
        <div className="flex flex-col gap-3 mt-2">
          <div>
            <label className="block mb-1" style={{fontSize:12,color:"var(--c-cream)"}}>Full Name *</label>
            <Input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Aisha Khan" className="w-full"/>
            {errors.name && <div style={{fontSize:11,color:"var(--c-red)",marginTop:3}}>{errors.name}</div>}
          </div>
          <div>
            <label className="block mb-1" style={{fontSize:12,color:"var(--c-cream)"}}>Role *</label>
            <Input value={role} onChange={e=>setRole(e.target.value)} placeholder="e.g. Barista, Cashier, Supervisor" className="w-full"/>
            {errors.role && <div style={{fontSize:11,color:"var(--c-red)",marginTop:3}}>{errors.role}</div>}
          </div>
          <div>
            <label className="block mb-1" style={{fontSize:12,color:"var(--c-cream)"}}>Shift</label>
            <div className="flex gap-2">
              {(["Shift A","Shift B"] as const).map(s => (
                <button key={s} onClick={()=>setShift(s)} style={{
                  flex:1, padding:"8px 0", borderRadius:8, fontSize:13, fontWeight:600,
                  border: shift===s ? "1.5px solid #C8874A" : "1.5px solid #3a2510",
                  background: shift===s ? "rgba(200,135,74,0.15)" : "rgba(30,18,10,0.5)",
                  color: shift===s ? "var(--c-c200)" : "var(--c-muted)", cursor:"pointer",
                }}>{s}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="tab" className="flex-1 justify-center" onClick={onClose}>Cancel</Button>
            <Button variant="brew" className="flex-1 justify-center" onClick={handleSubmit}>
              <i className="ti ti-device-floppy mr-1"/>Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────
function DeleteConfirmModal({ name, onConfirm, onClose }: {
  name: string; onConfirm:()=>void; onClose:()=>void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{maxWidth:380}} onClick={e=>e.stopPropagation()}>
        <div className="modal-box__head">
          <div className="modal-box__title">Remove Staff Member</div>
          <button className="modal-box__close" onClick={onClose}><i className="ti ti-x"/></button>
        </div>
        <div style={{color:"var(--c-cream)", fontSize:14, marginTop:8, lineHeight:1.6}}>
          Are you sure you want to remove <strong style={{color:"var(--c-cream)"}}>{name}</strong> from the team?
          <div style={{fontSize:12, color:"var(--c-cream)", marginTop:6}}>This will also remove their attendance records.</div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="tab" className="flex-1 justify-center" onClick={onClose}>Cancel</Button>
          <button onClick={onConfirm} style={{
            flex:1, padding:"8px 0", borderRadius:8, fontSize:13, fontWeight:600,
            background:"rgba(226,75,74,0.15)", color:"var(--c-red)",
            border:"1.5px solid rgba(226,75,74,0.35)", cursor:"pointer",
          }}>
            <i className="ti ti-trash mr-1"/>Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Staff Row ──────────────────────────────────────────────────────────────
function StaffEntryRow({ member, onCheckIn, onCheckOut, onEdit, onDelete }: {
  member: StaffEntry;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="staff-row" style={{alignItems:"center", gap:10}}>
      <Avatar initials={member.initials} color={member.color} imageUrl={member.imageUrl}/>
      <div className="flex-1 min-w-0">
        <div className="staff-row__name" style={{color:member.onDuty?"var(--c-cream)":"var(--c-cream)"}}>{member.name}</div>
        <div className="staff-row__role">{member.role} · {member.shift}{member.phone ? ` · ${member.phone}` : ""}</div>
        {member.onDuty && member.checkInTime && (
          <div style={{fontSize:11, color:"var(--c-green)", marginTop:2}}>
            <i className="ti ti-login mr-1" style={{fontSize:10}}/>Checked in {member.checkInTime}
          </div>
        )}
        {!member.onDuty && member.checkOutTime && (
          <div style={{fontSize:11, color:"var(--c-cream)", marginTop:2}}>
            <i className="ti ti-logout mr-1" style={{fontSize:10}}/>Left at {member.checkOutTime}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <Badge variant={member.onDuty ? "green" : "gray"}>{member.onDuty ? "On Duty" : "Off"}</Badge>
        <div className="flex gap-1.5">
          {!member.onDuty ? (
            <button onClick={onCheckIn} style={{
              fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:6,
              background:"rgba(76,175,80,0.12)", color:"var(--c-green)",
              border:"1px solid rgba(76,175,80,0.3)", cursor:"pointer",
            }}>
              <i className="ti ti-login mr-1" style={{fontSize:10}}/>Check In
            </button>
          ) : (
            <button onClick={onCheckOut} style={{
              fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:6,
              background:"rgba(226,75,74,0.12)", color:"var(--c-red)",
              border:"1px solid rgba(226,75,74,0.3)", cursor:"pointer",
            }}>
              <i className="ti ti-logout mr-1" style={{fontSize:10}}/>Check Out
            </button>
          )}
          <button onClick={onEdit} style={{
            fontSize:11, fontWeight:600, padding:"3px 8px", borderRadius:6,
            background:"rgba(200,135,74,0.1)", color:"var(--c-c200)",
            border:"1px solid rgba(200,135,74,0.25)", cursor:"pointer",
          }}>
            <i className="ti ti-pencil" style={{fontSize:12}}/>
          </button>
          <button onClick={onDelete} style={{
            fontSize:11, fontWeight:600, padding:"3px 8px", borderRadius:6,
            background:"rgba(226,75,74,0.08)", color:"var(--c-red)",
            border:"1px solid rgba(226,75,74,0.2)", cursor:"pointer",
          }}>
            <i className="ti ti-trash" style={{fontSize:12}}/>
          </button>
        </div>
      </div>
    </div>
  );
}

export function StaffPage({ staffList, onStaffChange }: StaffPageProps) {
  const [showForm,     setShowForm]     = useState(false);
  const [editTarget,   setEditTarget]   = useState<StaffEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const update = (fn: (prev: StaffEntry[]) => StaffEntry[]) =>
    onStaffChange(fn(staffList));

  const handleAdd = (member: StaffEntry) => update(prev => [...prev, member]);

  const handleEdit = (updated: StaffEntry) =>
    update(prev => prev.map(m => m.name === editTarget?.name ? updated : m));

  const handleDelete = (name: string) => {
    update(prev => prev.filter(m => m.name !== name));
    setDeleteTarget(null);
  };

  const handleCheckIn = (name: string) => {
    const t = now();
    update(prev => prev.map(m => m.name !== name ? m : {
      ...m, onDuty:true, checkInTime:t, checkOutTime:undefined,
      hoursLog: [...m.hoursLog, { date:today(), checkIn:t }],
    }));
  };

  const handleCheckOut = (name: string) => {
    const t = now();
    update(prev => prev.map(m => {
      if (m.name !== name) return m;
      const log = [...m.hoursLog];
      if (log.length > 0) log[log.length-1] = { ...log[log.length-1], checkOut:t };
      return { ...m, onDuty:false, checkOutTime:t, hoursLog:log };
    }));
  };

  const onDutyCount = staffList.filter(m => m.onDuty).length;

  return (
    <div className="animate-page-enter">
      <SectionTitle>Staff Management</SectionTitle>

      {showForm && <AddStaffModal onAdd={handleAdd} onClose={()=>setShowForm(false)}/>}
      {editTarget && (
        <EditStaffModal
          member={editTarget}
          onSave={handleEdit}
          onClose={() => setEditTarget(null)}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          name={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="card__head">
            <div className="card__title">
              Team <span style={{fontSize:12, color:"var(--c-cream)", fontWeight:400}}>({onDutyCount} on duty)</span>
            </div>
            <Button variant="brew-sm" onClick={()=>setShowForm(true)}>
              <i className="ti ti-plus mr-1"/>Add
            </Button>
          </div>
          {staffList.map(m => (
            <StaffEntryRow
              key={m.name} member={m}
              onCheckIn={()=>handleCheckIn(m.name)}
              onCheckOut={()=>handleCheckOut(m.name)}
              onEdit={()=>setEditTarget(m)}
              onDelete={()=>setDeleteTarget(m.name)}
            />
          ))}
          {staffList.length === 0 && (
            <div style={{textAlign:"center", padding:"24px 0", color:"var(--c-cream)", fontSize:13}}>
              <i className="ti ti-users" style={{fontSize:28, display:"block", marginBottom:8, opacity:0.4}}/>
              No staff members yet
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="card">
            <div className="card__head"><div className="card__title">Shifts Today</div></div>
            {(["Shift A","Shift B"] as const).map(s => {
              const members  = staffList.filter(m => m.shift === s);
              const isActive = members.some(m => m.onDuty);
              return (
                <div key={s} className={`shift-block ${isActive?"shift-block--active":"shift-block--inactive"}`}>
                  <div className="shift-block__title">{s} · {s==="Shift A"?"7:00 AM – 3:00 PM":"3:00 PM – 10:00 PM"}</div>
                  <div className="shift-block__names">{members.map(m=>m.name).join(", ") || "No staff"}</div>
                </div>
              );
            })}
          </div>

          <div className="card">
            <div className="card__head"><div className="card__title">Today's Attendance</div></div>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{color:"var(--c-cream)", fontWeight:600, fontSize:11, paddingBottom:6}}>Name</th>
                  <th style={{color:"var(--c-cream)", fontWeight:600, fontSize:11, paddingBottom:6, textAlign:"center"}}>Check In</th>
                  <th style={{color:"var(--c-cream)", fontWeight:600, fontSize:11, paddingBottom:6, textAlign:"center"}}>Check Out</th>
                  <th style={{color:"var(--c-cream)", fontWeight:600, fontSize:11, paddingBottom:6, textAlign:"right"}}>Status</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map(m => {
                  const todayStr = new Date().toLocaleDateString("en-IN");
                  const last = m.hoursLog.filter(e => e.date === todayStr).slice(-1)[0];
                  return (
                    <tr key={m.name}>
                      <td style={{color:"var(--c-cream)", paddingBottom:6}}>{m.name}</td>
                      <td style={{textAlign:"center", color:"var(--c-green)", fontWeight:600, fontSize:12}}>
                        {last?.checkIn ?? <span style={{color:"var(--c-cream)"}}>—</span>}
                      </td>
                      <td style={{textAlign:"center", color:"var(--c-red)", fontWeight:600, fontSize:12}}>
                        {last?.checkOut ?? <span style={{color:"var(--c-cream)"}}>—</span>}
                      </td>
                      <td style={{textAlign:"right"}}>
                        <Badge variant={m.onDuty ? "green" : last?.checkIn ? "gray" : "gray"}>
                          {m.onDuty ? "Active" : last?.checkIn ? "Done" : "Absent"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {staffList.length === 0 && (
                  <tr><td colSpan={4} style={{textAlign:"center", color:"var(--c-cream)", fontSize:12, padding:"12px 0"}}>No staff</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}