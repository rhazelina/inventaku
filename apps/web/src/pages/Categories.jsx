// src/pages/Categories.jsx
import SimpleCrud from "./_SimpleCrud";
import { apiCategories } from "../lib/api";

export default function Categories() {
  return (
    <SimpleCrud
      title="Categories"
      subtitle="Master data kategori barang."
      api={apiCategories}
      fields={[
        { key: "name", label: "Nama", placeholder: "Elektronik" },
        { key: "description", label: "Deskripsi", placeholder: "Opsional" },
      ]}
    />
  );
}
