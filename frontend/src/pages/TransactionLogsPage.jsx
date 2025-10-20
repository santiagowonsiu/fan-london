import { useEffect, useState } from "react";
import { fetchTransactions } from "../lib/api";

export default function TransactionLogsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchTransactions({ page, limit: 50 });
      setRows(data.transactions || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (e) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div>
      <h2 className="page-title" style={{ fontSize: 20 }}>Transaction Logs</h2>
      {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th className="th">Item</th>
              <th className="th">Type</th>
              <th className="th">Direction</th>
              <th className="th">Quantity</th>
              <th className="th">Date/Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="td" colSpan={5}>Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="td" colSpan={5}>No transactions</td></tr>
            ) : rows.map((tx) => (
              <tr key={tx._id}>
                <td className="td">{tx.itemId?.name || "-"}</td>
                <td className="td">{tx.itemId?.type || "-"}</td>
                <td className="td" style={{ textTransform: "uppercase", fontWeight: tx.direction === "in" ? 600 : 400, color: tx.direction === "in" ? "#059669" : "#dc2626" }}>
                  {tx.direction}
                </td>
                <td className="td">{tx.quantity}</td>
                <td className="td">{new Date(tx.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <button type="button" className="button" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page <= 1}>Prev</button>
        <span>Page {page} / {pages} • Total {total}</span>
        <button type="button" className="button" onClick={() => setPage((p) => Math.min(p + 1, pages))} disabled={page >= pages}>Next</button>
      </div>
    </div>
  );
}
