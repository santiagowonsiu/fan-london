import { useEffect, useMemo, useState } from "react";
import { createItem, fetchItems, toggleArchive, updateItem } from "../lib/api";

export default function ItemsTable() {
  const [items, setItems] = useState([]);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState(null);
  const [draft, setDraft] = useState({ type: "", name: "" });
  const [newItem, setNewItem] = useState({ type: "", name: "" });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50); // default 50
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const filtered = useMemo(() => items, [items]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchItems({ includeArchived, q: query, page, limit });
      // data: { items, total, page, pages, limit }
      setItems(data.items || []);
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
  }, [includeArchived, query, page, limit]);

  function startEdit(item) {
    setEditId(item._id);
    setDraft({ type: item.type, name: item.name });
  }

  function cancelEdit() {
    setEditId(null);
    setDraft({ type: "", name: "" });
  }

  async function saveEdit(id) {
    try {
      const updated = await updateItem(id, draft);
      setItems((prev) => prev.map((it) => (it._id === id ? updated : it)));
      cancelEdit();
    } catch (e) {
      alert(e.message);
    }
  }

  async function onToggleArchive(id) {
    try {
      const updated = await toggleArchive(id);
      setItems((prev) => prev.map((it) => (it._id === id ? updated : it)));
    } catch (e) {
      alert(e.message);
    }
  }

  async function addNew(e) {
    e.preventDefault();
    if (!newItem.type.trim() || !newItem.name.trim()) return;
    try {
      const created = await createItem({ type: newItem.type, name: newItem.name });
      // reload first page to keep order
      setPage(1);
      setNewItem({ type: "", name: "" });
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  const headerCellStyle = {
    textAlign: "left",
    borderBottom: "1px solid #ddd",
    padding: 8,
    position: "sticky",
    top: 0,
    background: "#fff",
    zIndex: 1,
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Inventory</h2>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <input
          placeholder="Search..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          style={{ padding: 6, flex: 1 }}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => { setIncludeArchived(e.target.checked); setPage(1); }}
          />
          Show archived
        </label>
        <select value={String(limit)} onChange={(e) => { const v = e.target.value; setLimit(v === "all" ? "all" : parseInt(v, 10)); setPage(1); }}>
          <option value="50">50</option>
          <option value="100">100</option>
          <option value="all">All</option>
        </select>
        <button onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {error && <div style={{ color: "red" }}>{error}</div>}

      <form onSubmit={addNew} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          placeholder="Type"
          value={newItem.type}
          onChange={(e) => setNewItem((s) => ({ ...s, type: e.target.value }))}
          style={{ padding: 6, width: 220 }}
        />
        <input
          placeholder="Item name"
          value={newItem.name}
          onChange={(e) => setNewItem((s) => ({ ...s, name: e.target.value }))}
          style={{ padding: 6, flex: 1 }}
        />
        <button type="submit">Add</button>
      </form>

      <div style={{ maxHeight: 500, overflow: "auto", border: "1px solid #eee" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={headerCellStyle}>Type</th>
              <th style={headerCellStyle}>Item</th>
              <th style={headerCellStyle}>Archived</th>
              <th style={headerCellStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ padding: 12 }}>Loading...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 12 }}>No items</td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item._id} style={{ opacity: item.archived ? 0.6 : 1 }}>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                    {editId === item._id ? (
                      <input
                        value={draft.type}
                        onChange={(e) => setDraft((s) => ({ ...s, type: e.target.value }))}
                        style={{ padding: 6, width: 220 }}
                      />
                    ) : (
                      item.type
                    )}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                    {editId === item._id ? (
                      <input
                        value={draft.name}
                        onChange={(e) => setDraft((s) => ({ ...s, name: e.target.value }))}
                        style={{ padding: 6, width: "100%" }}
                      />
                    ) : (
                      item.name
                    )}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                    <span>{item.archived ? "Yes" : "No"}</span>
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8, display: "flex", gap: 8 }}>
                    {editId === item._id ? (
                      <>
                        <button onClick={() => saveEdit(item._id)}>Save</button>
                        <button onClick={cancelEdit}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(item)}>Edit</button>
                        <button onClick={() => onToggleArchive(item._id)}>
                          {item.archived ? "Unarchive" : "Archive"}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {limit !== "all" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
          <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page <= 1}>Prev</button>
          <span>
            Page {page} / {pages} • Total {total}
          </span>
          <button onClick={() => setPage((p) => Math.min(p + 1, pages))} disabled={page >= pages}>Next</button>
        </div>
      )}
    </div>
  );
}
