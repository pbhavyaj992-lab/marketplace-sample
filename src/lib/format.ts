export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
export const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
export const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
