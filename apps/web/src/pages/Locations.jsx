// src/pages/Locations.jsx
import SimpleCrud from "./_SimpleCrud";
import { apiLocations } from "../lib/api";

export default function Locations() {
  return (
    <SimpleCrud
      title="Locations"
      subtitle="Master data lokasi penyimpanan barang."
      api={apiLocations}
      fields={[
        { key: "name", label: "Nama", placeholder: "Lab RPL" },
        { key: "description", label: "Deskripsi", placeholder: "Opsional" },
      ]}
    />
  );
}
