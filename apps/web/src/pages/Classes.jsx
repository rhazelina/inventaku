import SimpleCrud from "./_SimpleCrud";
import { apiClasses } from "../lib/api";

export default function Classes() {
  return (
    <SimpleCrud
      title="Classes"
      subtitle="Master data kelas/rombel (opsional tergantung konteks)."
      api={apiClasses}
      fields={[
        { key: "name", label: "Nama", placeholder: "XI RPL 1" },
        { key: "level", label: "Tingkat", placeholder: "XI" },
        { key: "major", label: "Jurusan", placeholder: "RPL" },
      ]}
    />
  );
}
