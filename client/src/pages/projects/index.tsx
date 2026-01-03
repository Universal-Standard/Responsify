import { useState } from "react";
import { useAuth } from "../../hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Project = {
  id: number;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  analysisCount: number;
  memberCount: number;
  createdAt: string;
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
  });

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });

  const createProject = useMutation({
    mutationFn: async (data: typeof newProject) => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create project");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setShowCreateModal(false);
      setNewProject({ name: "", description: "", color: "#3B82F6" });
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (projectId: number) => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete project");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
  });

  const handleCreateProject = () => {
    if (newProject.name.trim()) {
      createProject.mutate(newProject);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Projects</h1>
          <p className="text-gray-600">Organize your analyses into projects</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          + New Project
        </button>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
            >
              <div
                className="h-3"
                style={{ backgroundColor: project.color }}
              ></div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${project.color}20` }}
                    >
                      {project.icon || "📁"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-4">
                    <span>{project.analysisCount} analyses</span>
                    {project.memberCount > 1 && (
                      <span>{project.memberCount} members</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                    View
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this project?")) {
                        deleteProject.mutate(project.id);
                      }
                    }}
                    className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-6">Create your first project to organize your analyses</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Create Project
          </button>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-6">Create New Project</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Project Name</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="My Website Redesign"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description (optional)</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Track mobile responsiveness improvements..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <div className="flex gap-2">
                  {["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"].map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewProject({ ...newProject, color })}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        newProject.color === color ? "border-gray-900 scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProject.name.trim() || createProject.isPending}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
              >
                {createProject.isPending ? "Creating..." : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
