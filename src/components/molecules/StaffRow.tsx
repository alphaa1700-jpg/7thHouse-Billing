import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";

interface StaffRowMember {
  initials: string; name: string; role: string;
  shift: string; onDuty: boolean; color: string;
  imageUrl?: string;
}

export function StaffRow({ member }: { member: StaffRowMember }) {
  return (
    <div className="staff-row">
      <Avatar initials={member.initials} color={member.color} imageUrl={member.imageUrl} />
      <div className="flex-1">
        <div className="staff-row__name" style={{ color: member.onDuty ? "#2c1a0e" : "#7a5a3a" }}>{member.name}</div>
        <div className="staff-row__role">{member.role} · {member.shift}</div>
      </div>
      <Badge variant={member.onDuty ? "green" : "gray"}>{member.onDuty ? "On Duty" : "Off"}</Badge>
    </div>
  );
}