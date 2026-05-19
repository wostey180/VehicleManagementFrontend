import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch, fmtCurrency, fmtDate } from "../../utils/api";
import { PageHeader, PageWrapper, DataTable, Th, Td, TrHover } from "../../components/shared/PortalLayout";
import { Spinner, EmptyState, ErrorMsg } from "../../components/shared/Feedback";
import type { CustomerResponse } from "../../types";
import { Search } from "lucide-react";

export default function CustomerSearch() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerResponse[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(""); setSearched(true);
    try {
      const r = await apiFetch(`/customers/search?query=${encodeURIComponent(query)}`, user?.token);
      if (!r.ok) throw new Error("Search failed");
      setResults(await r.json());
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  };

  return (
    <PageWrapper>
      <PageHeader title="Customer Search" subtitle="Search by name, email, phone, vehicle plate, or customer ID." />

      <div className="flex gap-3 mb-8 max-w-xl">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9490]" />
          <input
            type="text"
            placeholder="Name, email, phone, plate, ID…"
            className="w-full bg-[#1A1815] border border-[#3A3530] rounded-lg pl-10 pr-4 py-3 text-sm text-[#EDEAE4] placeholder-[#9A9490]/60 outline-none focus:border-[#C97B4A] transition-colors font-[DM_Sans]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-5 py-2.5 bg-[#C97B4A] hover:bg-[#A85E30] text-[#0C0B0A] font-[Syne] font-bold text-sm rounded-lg transition-colors disabled:opacity-40"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {error && <ErrorMsg message={error} />}
      {loading && <Spinner />}

      {!loading && searched && results.length === 0 && <EmptyState message={`No customers found for "${query}".`} />}

      {!loading && results.length > 0 && (
        <DataTable>
          <thead>
            <tr>
              <Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th right>Total Spent</Th><Th right>Loyalty Pts</Th><Th>Joined</Th>
            </tr>
          </thead>
          <tbody>
            {results.map((c) => (
              <TrHover key={c.id}>
                <Td><span className="font-medium">{c.fullName}</span></Td>
                <Td muted>{c.email}</Td>
                <Td muted>{c.phone || "—"}</Td>
                <Td right>{fmtCurrency(c.totalSpent)}</Td>
                <Td right><span className="text-[#EF9F27] font-[Syne] font-bold">{c.loyaltyPoints}</span></Td>
                <Td muted>{fmtDate(c.createdAt)}</Td>
              </TrHover>
            ))}
          </tbody>
        </DataTable>
      )}
    </PageWrapper>
  );
}
