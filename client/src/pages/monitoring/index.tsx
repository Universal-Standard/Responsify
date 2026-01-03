import { useState } from 'react';
import { useAuth } from '../../hooks/use-auth';
import {
  useMonitoringSchedules,
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
  usePauseSchedule,
  useResumeSchedule,
} from '../../hooks/use-api';
import { Clock, Plus, Play, Pause, Edit2, Trash2, TrendingUp, TrendingDown } from 'lucide-react';

export default function MonitoringPage() {
  const { user } = useAuth();
  const { data: schedules = [], isLoading } = useMonitoringSchedules(user?.id || '');
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const deleteSchedule = useDeleteSchedule();
  const pauseSchedule = usePauseSchedule();
  const resumeSchedule = useResumeSchedule();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);

  const [formData, setFormData] = useState({
    url: '',
    frequency: 'daily' as 'hourly' | 'daily' | 'weekly' | 'monthly',
    alertThreshold: 75,
    emailAlert: true,
  });

  // Calculate stats
  const activeSchedules = schedules.filter((s: any) => s.isActive).length;
  const totalAlerts = 0; // TODO: Get from database
  const avgScore =
    schedules.length > 0
      ? Math.round(
          schedules.reduce((sum: number, s: any) => sum + (s.lastScore || 0), 0) / schedules.length
        )
      : 0;

  const handleCreate = async () => {
    if (!user) return;

    await createSchedule.mutateAsync({
      ...formData,
      userId: user.id,
    });

    setShowCreateModal(false);
    setFormData({
      url: '',
      frequency: 'daily',
      alertThreshold: 75,
      emailAlert: true,
    });
  };

  const handleEdit = async (schedule: any) => {
    if (!editingSchedule) return;

    await updateSchedule.mutateAsync({
      id: editingSchedule.id,
      ...formData,
    });

    setEditingSchedule(null);
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this monitoring schedule?')) return;
    await deleteSchedule.mutateAsync(scheduleId);
  };

  const handlePause = async (scheduleId: string) => {
    await pauseSchedule.mutateAsync(scheduleId);
  };

  const handleResume = async (scheduleId: string) => {
    await resumeSchedule.mutateAsync(scheduleId);
  };

  const openEditModal = (schedule: any) => {
    setEditingSchedule(schedule);
    setFormData({
      url: schedule.url,
      frequency: schedule.frequency,
      alertThreshold: schedule.alertThreshold,
      emailAlert: schedule.emailAlert,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Clock className="w-8 h-8 text-indigo-600" />
              Monitoring Schedules
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Automate website checks and receive alerts on score changes
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Schedule
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Schedules</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{schedules.length}</p>
            </div>
            <Clock className="w-12 h-12 text-indigo-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Now</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{activeSchedules}</p>
            </div>
            <Play className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Alerts Today</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{totalAlerts}</p>
            </div>
            <TrendingDown className="w-12 h-12 text-yellow-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Score</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{avgScore}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Monitoring Schedules
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first schedule to start automated website monitoring
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Your First Schedule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((schedule: any) => (
            <div key={schedule.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {schedule.url}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        schedule.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {schedule.isActive ? 'Active' : 'Paused'}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                      {schedule.frequency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Score */}
              {schedule.lastScore !== null && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Last Score</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {schedule.lastScore}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${schedule.lastScore}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Threshold */}
              <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Alert Threshold</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {schedule.alertThreshold}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {schedule.isActive ? (
                  <button
                    onClick={() => handlePause(schedule.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={() => handleResume(schedule.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Resume
                  </button>
                )}
                <button
                  onClick={() => openEditModal(schedule)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(schedule.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingSchedule) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {editingSchedule ? 'Edit Schedule' : 'Create Schedule'}
            </h2>

            <div className="space-y-4">
              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Check Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      frequency: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="hourly">Every Hour</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {/* Alert Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Alert Threshold: {formData.alertThreshold}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.alertThreshold}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      alertThreshold: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Alert when score drops below this value
                </p>
              </div>

              {/* Email Alert */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="emailAlert"
                  checked={formData.emailAlert}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emailAlert: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="emailAlert" className="text-sm text-gray-700 dark:text-gray-300">
                  Send email alerts
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingSchedule(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingSchedule ? handleEdit : handleCreate}
                disabled={!formData.url || createSchedule.isPending || updateSchedule.isPending}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createSchedule.isPending || updateSchedule.isPending
                  ? 'Saving...'
                  : editingSchedule
                  ? 'Save Changes'
                  : 'Create Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
