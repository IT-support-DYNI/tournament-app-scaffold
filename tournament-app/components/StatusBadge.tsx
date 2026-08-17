const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  REGISTRATION_OPEN: "bg-emerald-100 text-emerald-700",
  REGISTRATION_CLOSED: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-sky-100 text-sky-700",
  ONGOING: "bg-sky-100 text-sky-700",
  COMPLETED: "bg-violet-100 text-violet-700",
  WAITING: "bg-slate-100 text-slate-600",
  READY: "bg-emerald-100 text-emerald-700",
  CANCELED: "bg-rose-100 text-rose-700",
  BYE: "bg-slate-100 text-slate-500",
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-500",
  ELIMINATED: "bg-rose-100 text-rose-700",
  BANNED: "bg-rose-100 text-rose-700",
};

function label(status: string) {
  return status.replace(/_/g, " ");
}

export default function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {label(status)}
    </span>
  );
}
