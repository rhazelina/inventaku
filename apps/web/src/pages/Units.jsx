// src/pages/Units.jsx
import SimpleCrud from "./_SimpleCrud";
import { apiUnits } from "../lib/api";

export default function Units() {
  return (
    <SimpleCrud
      title="Units"
      subtitle="Master data satuan (pcs, box, unit, liter...)."
      api={apiUnits}
      fields={[
        { key: "name", label: "Nama", placeholder: "Piece" },
        { key: "abbreviation", label: "Singkatan", placeholder: "pcs" },
        { key: "description", label: "Deskripsi", placeholder: "Opsional" },
      ]}
    />
  );
}
