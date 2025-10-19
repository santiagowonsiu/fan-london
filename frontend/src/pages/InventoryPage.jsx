import ItemsTable from "../components/ItemsTable";

export default function InventoryPage() {
  return (
    <div className="app-container">
      <h1 className="page-title">Inventory Manager</h1>
      <div className="section">
        <div className="section-body">
          <ItemsTable />
        </div>
      </div>
    </div>
  );
}
