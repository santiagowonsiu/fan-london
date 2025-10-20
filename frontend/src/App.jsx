import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import InventoryPage from "./pages/InventoryPage";
import SettingsPage from "./pages/SettingsPage";
import AccountPage from "./pages/AccountPage";
import TransactionsPage from "./pages/TransactionsPage";
import TransactionLogsPage from "./pages/TransactionLogsPage";
import CurrentStockPage from "./pages/CurrentStockPage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<InventoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/logs" element={<TransactionLogsPage />} />
        <Route path="/stock" element={<CurrentStockPage />} />
        <Route path="/account" element={<AccountPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
