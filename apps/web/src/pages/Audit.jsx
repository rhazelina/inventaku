// src/pages/Audit.jsx
import { useEffect, useState } from "react";
import { apiAudit } from "../lib/api";
import { PageShell, LoadingLine, ErrorBox, TextInput, SecondaryButton } from "./_ui";

export default function Audit() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [rows, setRows] = useState([]);

  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await apiAudit.list({
        ...(action ? { action } : {}),
        ...(entity ? { entity } : {}),
      });
      setRows(Array.isArray(res) ? res : res?.data || []);
    } catch (e) {
      setErr(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, entity]);

  return (
    <PageShell
      title="Audit"
      subtitle="Log aktivitas (nilai plus UKK)."
      right={
        <div className="flex gap-2">
          <SecondaryButton onClick={load} disabled={loading}>
            Terapkan Filter
          </SecondaryButton>
        </div>
      }
    >
      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <TextInput
          label="Filter Action (opsional)"
          value={action}
          onChange={setAction}
          placeholder="CREATE / UPDATE / DELETE / LOGIN"
        />
        <TextInput
          label="Filter Entity (opsional)"
          value={entity}
          onChange={setEntity}
          placeholder="items / categories / users"
        />
      </div>

      <ErrorBox error={err} />

      {loading ? (
        <LoadingLine />
      ) : (
        <div className="overflow-auto border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left">
                <th className="p-2">Waktu</th>
                <th className="p-2">User</th>
                <th className="p-2">Action</th>
                <th className="p-2">Entity</th>
                <th className="p-2">Entity ID</th>
                <th className="p-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="p-3 text-neutral-600" colSpan={6}>
                    Belum ada log.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-t align-top">
                    <td className="p-2 text-xs">{r.timestamp ? new Date(r.timestamp).toLocaleString("id-ID") : "-"}</td>
                    <td className="p-2">{r.userName || "-"}</td>
                    <td className="p-2 font-medium">{r.action || "-"}</td>
                    <td className="p-2">{r.entity || "-"}</td>
                    <td className="p-2 text-xs">{r.entityId ?? "-"}</td>
                    <td className="p-2">
                      <pre className="text-xs whitespace-pre-wrap break-words max-w-xs">
                        {r.details ? JSON.stringify(r.details, null, 2) : "-"}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
