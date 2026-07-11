// Tipos base do Lokaro — serão expandidos nos próximos prompts

export type MemberStatus = "active" | "inactive" | "trial" | "overdue";
export type RoomType = "meeting_room" | "hot_desk" | "private_office" | "house" | "kitnet" | "apartment";
export type UserRole = "operator" | "member";
export type InvoiceStatus = "pending" | "paid" | "overdue" | "cancelled";

export interface Space {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  logo_url: string | null;
  timezone: string;
  currency: "USD" | "EUR" | "GBP" | "BRL";
  plan: "free" | "starter" | "pro";
  email_sender_name: string | null;
  created_at: string;
}

export interface Member {
  id: string;
  space_id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  status: MemberStatus;
  plan_id: string | null;
  avatar_url: string | null;
  joined_at: string;
}

export interface Room {
  id: string;
  space_id: string;
  name: string;
  type: RoomType;
  capacity: number;
  price_per_hour: number | null;
  is_active: boolean;
  color: string;
  open_time: string;
  close_time: string;
  is_24h: boolean;
}

export interface Booking {
  id: string;
  space_id: string;
  room_id: string;
  member_id: string;
  starts_at: string;
  ends_at: string;
  status: "confirmed" | "cancelled";
  notes: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  space_id: string;
  member_id: string | null;
  member_name?: string | null;
  member_email?: string | null;
  status: InvoiceStatus;
  due_date: string | null;
  amount: number | null;
  amount_cents: number | null;
  description: string | null;
  created_at: string;
  paid_at: string | null;
  [key: string]: unknown;
}

export interface Lease {
  id: string;
  space_id: string;
  unit_id: string;
  member_id: string;
  monthly_rent: number;
  due_day: number;
  starts_on: string;
  ends_on: string | null;
  status: "active" | "ended";
  notes: string | null;
  created_at: string;
}
