import { useEffect, useState } from "react";
import { fetchHealth } from "../api/health";
import { StatusRow } from "../components/StatusRow";

type RemoteStatus = "checking" | "ok" | "error";

export function HomePage() {
  const [backend, setBackend] = useState<RemoteStatus>("checking");
  const [database, setDatabase] = useState<RemoteStatus>("checking");
  const [detail, setDetail] = useState("Contacting /api/health…");

  useEffect(() => {
    const controller = new AbortController();

    void fetchHealth(controller.signal)
      .then(() => {
        setBackend("ok");
        setDatabase("ok");
        setDetail("All systems are responding normally.");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setBackend("error");
        setDatabase("error");
        setDetail(error instanceof Error ? error.message : "Health check failed.");
      });

    return () => controller.abort();
  }, []);

  const display = (status: RemoteStatus) => (status === "checking" ? "Checking…" : status.toUpperCase());

  return (
    <main className="shell">
      <section className="card" aria-labelledby="page-title">
        <div className="eyebrow">Workers · D1 · R2</div>
        <h1 id="page-title">Cloudflare Full Stack Environment</h1>
        <p className="intro">A single edge-native deployment for the interface, API, database, and object storage.</p>

        <div className="status-panel" aria-live="polite">
          <StatusRow label="Frontend" value="OK" tone="ok" />
          <StatusRow label="Backend API" value={display(backend)} tone={backend === "checking" ? "pending" : backend} />
          <StatusRow label="D1 Database" value={display(database)} tone={database === "checking" ? "pending" : database} />
        </div>

        <p className="detail">{detail}</p>
      </section>
    </main>
  );
}

