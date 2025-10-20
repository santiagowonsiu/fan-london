import { useEffect, useState } from "react";
import { fetchStock } from "../lib/api";

export default function CurrentStockPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchStock();
      setRows(data.stock || []);
    } catch (e) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter((r) => {
    const q = query.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.type.toLowerCase().includes(q);
  });

  return (
    <div>
      <h2 className="page-title" style={{ fontSize: 20 }}>Current Stock</h2>
      <div className="controls">
        <input
          className="input input-full"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" className="button" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>
      {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th className="th">Type</th>
              <th className="th">Item</th>
              <th className="th">Stock</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="td" colSpan={3}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="td" colSpan={3}>No data</td></tr>
            ) : filtered.map((r) => (
              <tr key={r.itemId}>
                <td className="td">{r.type}</td>
                <td className="td">{r.name}</td>
                <td className="td" style={{ fontWeight: 600, color: r.stock < 0 ? "#dc2626" : r.stock === 0 ? "#6b7280" : "#059669" }}>
                  {r.stock}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
