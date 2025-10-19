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
      await createItem({ type: newItem.type, name: newItem.name });
      setPage(1);
      setNewItem({ type: "", name: "" });
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div>
      <h2 className="page-title" style={{ fontSize: 20 }}>Inventory</h2>
      <div className="controls">
        <input
          className="input input-full"
          placeholder="Search..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
        />
        <label className="checkbox">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => { setIncludeArchived(e.target.checked); setPage(1); }}
          />
          Show archived
        </label>
        <select className="select" value={String(limit)} onChange={(e) => { const v = e.target.value; setLimit(v === "all" ? "all" : parseInt(v, 10)); setPage(1); }}>
          <option value="50">50</option>
          <option value="100">100</option>
          <option value="all">All</option>
        </select>
        <button type="button" className="button" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {error && <div style={{ color: "#b91c1c" }}>{error}</div>}

      <form onSubmit={addNew} className="controls" style={{ marginBottom: 12 }}>
        <input
          className="input"
          placeholder="Type"
          value={newItem.type}
          onChange={(e) => setNewItem((s) => ({ ...s, type: e.target.value }))}
          style={{ width: 220 }}
        />
        <input
          className="input input-full"
          placeholder="Item name"
          value={newItem.name}
          onChange={(e) => setNewItem((s) => ({ ...s, name: e.target.value }))}
        />
        <button className="button primary" type="submit">Add</button>
      </form>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th className="th">Type</th>
              <th className="th">Item</th>
              <th className="th">Archived</th>
              <th className="th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="td" colSpan={4}>Loading...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="td" colSpan={4}>No items</td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item._id} className={item.archived ? "row-archived" : undefined}>
                  <td className="td">
                    {editId === item._id ? (
                      <input
                        className="input"
                        value={draft.type}
                        onChange={(e) => setDraft((s) => ({ ...s, type: e.target.value }))}
                        style={{ width: 220 }}
                      />
                    ) : (
                      item.type
                    )}
                  </td>
                  <td className="td">
                    {editId === item._id ? (
                      <input
                        className="input input-full"
                        value={draft.name}
                        onChange={(e) => setDraft((s) => ({ ...s, name: e.target.value }))}
                      />
                    ) : (
                      item.name
                    )}
                  </td>
                  <td className="td">
                    <span>{item.archived ? "Yes" : "No"}</span>
                  </td>
                  <td className="td" style={{ display: "flex", gap: 8 }}>
                    {editId === item._id ? (
                      <>
                        <button type="button" className="button" onClick={() => saveEdit(item._id)}>Save</button>
                        <button type="button" className="button" onClick={cancelEdit}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="button" onClick={() => startEdit(item)}>Edit</button>
                        <button type="button" className="button" onClick={() => onToggleArchive(item._id)}>
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

      {limit !== "all" && (
        <div className="pagination">
          <button type="button" className="button" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page <= 1}>Prev</button>
          <span>
            Page {page} / {pages} • Total {total}
          </span>
          <button type="button" className="button" onClick={() => setPage((p) => Math.min(p + 1, pages))} disabled={page >= pages}>Next</button>
        </div>
      )}
    </div>
  );
}
