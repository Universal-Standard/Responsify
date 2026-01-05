import { useState } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { useAnalysisHistory } from '../../hooks/use-api';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Calendar,
  Download,
  ChevronDown
} from 'lucide-react';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  
  const { data: analysesData } = useAnalysisHistory(user?.id || '', {
    limit: 1000, // Get all for analytics
  });

  const analyses = analysesData?.data || [];

  // Calculate statistics
  const stats = {
    totalAnalyses: analyses.length,
    avgScore: analyses.length > 0
      ? Math.round(
          analyses.reduce((sum: number, a: any) => sum + (a.consensus_score || 0), 0) / 
          analyses.length
        )
      : 0,
    completedCount: analyses.filter((a: any) => a.status === 'completed').length,
    failedCount: analyses.filter((a: any) => a.status === 'failed').length,
  };

  // Group analyses by date for trend chart
  const analysesByDate = analyses.reduce((acc: any, analysis: any) => {
    const date = new Date(analysis.created_at).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const dates = Object.keys(analysesByDate).slice(-30); // Last 30 days
  const counts = dates.map(date => analysesByDate[date]);

  // Score distribution
  const scoreRanges = {
    'Excellent (90-100)': analyses.filter((a: any) => (a.consensus_score || 0) >= 90).length,
    'Good (80-89)': analyses.filter((a: any) => (a.consensus_score || 0) >= 80 && (a.consensus_score || 0) < 90).length,
    'Fair (70-79)': analyses.filter((a: any) => (a.consensus_score || 0) >= 70 && (a.consensus_score || 0) < 80).length,
    'Poor (<70)': analyses.filter((a: any) => (a.consensus_score || 0) < 70).length,
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      // Generate CSV
      const csv = [
        ['URL', 'Status', 'Score', 'Created At'].join(','),
        ...analyses.map((a: any) => 
          [a.url, a.status, a.consensus_score || 0, a.created_at].join(',')
        )
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${Date.now()}.csv`;
      link.click();
    } else {
      // PDF export would require a library like jsPDF
      alert('PDF export coming soon!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Analytics Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Insights and trends from your website analyses
            </p>
          </div>
          
          <div className="flex gap-3">
            {/* Time Range Selector */}
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>

            {/* Export Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
                <Download className="h-4 w-4" />
                Export
              </button>
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                >
                  Export as PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Analyses
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.totalAnalyses}
                </p>
              </div>
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg">
                <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 dark:text-green-400 font-medium">12%</span>
              <span className="text-gray-600 dark:text-gray-400 ml-2">vs last period</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Average Score
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.avgScore}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                <PieChart className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 dark:text-green-400 font-medium">5%</span>
              <span className="text-gray-600 dark:text-gray-400 ml-2">improvement</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Completed
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.completedCount}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {((stats.completedCount / (stats.totalAnalyses || 1)) * 100).toFixed(1)}% success rate
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Failed
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.failedCount}
                </p>
              </div>
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-red-600 dark:text-red-400 transform rotate-180" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {((stats.failedCount / (stats.totalAnalyses || 1)) * 100).toFixed(1)}% failure rate
              </span>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Analyses Trend Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Analysis Trend
            </h2>
            <div className="h-64 flex items-end justify-between gap-2">
              {counts.slice(-15).map((count, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-indigo-500 dark:bg-indigo-600 rounded-t transition-all hover:bg-indigo-600 dark:hover:bg-indigo-500"
                    style={{
                      height: `${(count / Math.max(...counts)) * 100}%`,
                      minHeight: '4px',
                    }}
                    title={`${count} analyses`}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 transform -rotate-45 origin-top-left">
                    {dates.slice(-15)[index]?.split('/')[1]}/{dates.slice(-15)[index]?.split('/')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Score Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Score Distribution
            </h2>
            <div className="space-y-4">
              {Object.entries(scoreRanges).map(([range, count]) => {
                const percentage = (count / (stats.totalAnalyses || 1)) * 100;
                const colors: any = {
                  'Excellent (90-100)': 'bg-green-500',
                  'Good (80-89)': 'bg-blue-500',
                  'Fair (70-79)': 'bg-yellow-500',
                  'Poor (<70)': 'bg-red-500',
                };
                
                return (
                  <div key={range}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {range}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`${colors[range]} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Performing Websites */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Performing Websites
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Website
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Score
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {analyses
                  .filter((a: any) => a.consensus_score)
                  .sort((a: any, b: any) => (b.consensus_score || 0) - (a.consensus_score || 0))
                  .slice(0, 10)
                  .map((analysis: any) => (
                    <tr
                      key={analysis.id}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white truncate max-w-xs">
                        {analysis.url}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                          {analysis.consensus_score}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          analysis.status === 'completed'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
                        }`}>
                          {analysis.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(analysis.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
