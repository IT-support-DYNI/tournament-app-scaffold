import Link from "next/link";

type Accent = "emerald" | "sky" | "violet" | "amber" | "rose" | "slate";

const ACCENT_STYLES: Record<Accent, string> = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  sky: "bg-sky-50 text-sky-700 ring-sky-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
  slate: "bg-slate-50 text-slate-700 ring-slate-100",
};

type Props = {
  label: string;
  value: string | number;
  icon?: string;
  accent?: Accent;
  href?: string;
};

export default function StatTile({
  label,
  value,
  icon,
  accent = "slate",
  href,
}: Props) {
  const content = (
    <div
      className={`flex items-center gap-4 rounded-2xl p-5 ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${ACCENT_STYLES[accent]}`}
    >
      {icon && (
        <span className="text-2xl leading-none">
          {icon}
        </span>
      )}

      <div>
        <p className="text-2xl font-extrabold tracking-tight">
          {value}
        </p>

        <p className="text-sm font-medium opacity-80">
          {label}
        </p>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
