import ItemsTable from "../components/ItemsTable";

export default function InventoryPage() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 16 }}>
      <h1 style={{ margin: 0, marginBottom: 12, textAlign: "left" }}>Inventory Manager</h1>
      <ItemsTable />
    </div>
  );
}
