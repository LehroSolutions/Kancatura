import {
  BadgeCheck, BarChart3, BriefcaseBusiness, CircleDollarSign, ClipboardCheck,
  FileCheck2, FileSpreadsheet, FileText, Headphones, Megaphone, Rocket,
  ShieldCheck, Target, UsersRound, WalletCards, type LucideIcon
} from "lucide-react";

const workspaceIcons: Record<string, LucideIcon> = {
  BadgeCheck, BarChart3, BriefcaseBusiness, CircleDollarSign, ClipboardCheck,
  FileCheck2, FileSpreadsheet, FileText, Headphones, Megaphone, Rocket,
  ShieldCheck, Target, UsersRound, WalletCards
};

export function resolveIcon(name: string): LucideIcon {
  return workspaceIcons[name] ?? Target;
}
