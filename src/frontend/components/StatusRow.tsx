type StatusTone = "ok" | "pending" | "error";

interface StatusRowProps {
  label: string;
  value: string;
  tone: StatusTone;
}

export function StatusRow({ label, value, tone }: StatusRowProps) {
  return (
    <div className="status-row">
      <span className="status-label">{label}</span>
      <span className={`status-value status-${tone}`}>
        <span className="status-dot" aria-hidden="true" />
        {value}
      </span>
    </div>
  );
}

