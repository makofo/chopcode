import React, { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Finance() {
  const [data, setData] = useState({ transactions: [], balance: 0 });
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("expense");

  const load = () => api.get("/api/finance").then(setData).catch(console.error);

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!amount || !category) return;
    await api.post("/api/finance", { amount: Number(amount), category, type });
    setAmount("");
    setCategory("");
    load();
  };

  return (
    <div>
      <h2>Финансы</h2>
      <div className="card">
        <b>Баланс: {data.balance.toFixed(2)} ₽</b>
      </div>
      <div className="card">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="expense">Расход</option>
          <option value="income">Доход</option>
        </select>
        <input
          placeholder="Сумма"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          placeholder="Категория (еда, транспорт...)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <button className="primary" onClick={add}>
          Добавить
        </button>
      </div>

      {data.transactions.map((t) => (
        <div className="card" key={t.id}>
          {t.type === "income" ? "➕" : "➖"} {t.amount} ₽ — {t.category}
        </div>
      ))}
    </div>
  );
}
