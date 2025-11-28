import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../utils/api";

function Invoices() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/invoices");
      setRows(data.data);
    } catch (err) {
      console.error("Invoice fetch failed:", err);
      alert("❌ Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const filtered = rows.filter((inv) => inv.customerName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <Sidebar />
      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search invoices"
        />
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv._id}>
                  <td>{inv.invoiceNo}</td>
                  <td>{inv.customerName}</td>
                  <td>{inv.grandTotal}</td>
                  <td>{inv.status}</td>
                  <td>
                    <button>View</button>
                    <button>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Invoices;
