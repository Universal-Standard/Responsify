import { useState } from "react";
import { useAuth } from "../../hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

type Analysis = {
  id: number;
  url: string;
  status: string;
  consensusScore: number | null;
  createdAt: string;
  projectName?: string;
  tags?: string[];
  isFavorite: boolean;
};

export default function HistoryPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "score" | "url">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: analyses, isLoading } = useQuery<Analysis[]>({
    queryKey: ["/api/users", user?.id, "analyses", search, statusFilter, sortBy, sortOrder],
    enabled: !!user,
  });

  const filteredAnalyses = analyses?.filter((a) => {
    if (search && !a.url.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    return true;
  });

  const sortedAnalyses = filteredAnalyses?.sort((a, b) => {
    let comparison = 0;
    if (sortBy === "date") {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === "score") {
      comparison = (a.consensusScore || 0) - (b.consensusScore || 0);
    } else {
      comparison = a.url.localeCompare(b.url);
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analysis History</h1>
        <p className="text-gray-600">View and manage all your website analyses</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search by URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="analyzing">Analyzing</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split("-");
              setSortBy(newSortBy as "date" | "score" | "url");
              setSortOrder(newSortOrder as "asc" | "desc");
            }}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="score-desc">Highest Score</option>
            <option value="score-asc">Lowest Score</option>
            <option value="url-asc">URL (A-Z)</option>
            <option value="url-desc">URL (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {sortedAnalyses && sortedAnalyses.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedAnalyses.map((analysis) => (
                  <tr key={analysis.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {analysis.isFavorite && <span className="text-yellow-500">★</span>}
                        <a href={analysis.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline truncate max-w-xs">
                          {analysis.url}
                        </a>
                      </div>
                      {analysis.tags && analysis.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {analysis.tags.map((tag) => (
                            <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          analysis.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : analysis.status === "analyzing"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {analysis.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {analysis.consensusScore !== null ? (
                        <span className="font-semibold">{analysis.consensusScore}/100</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {analysis.projectName ? (
                        <Link href="/projects">
                          <a className="text-sm text-primary-600 hover:underline">{analysis.projectName}</a>
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-sm">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(analysis.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">No analyses yet</h3>
          <p className="text-gray-600 mb-6">Start by analyzing your first website!</p>
          <Link href="/">
            <a className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              Analyze Website
            </a>
          </Link>
        </div>
      )}

      {/* Pagination (placeholder) */}
      {sortedAnalyses && sortedAnalyses.length > 50 && (
        <div className="mt-6 flex justify-center gap-2">
          <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">Previous</button>
          <span className="px-4 py-2">Page 1 of 1</span>
          <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">Next</button>
        </div>
      )}
    </div>
  );
}
