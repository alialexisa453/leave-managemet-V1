import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function ManageSlots() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [formData, setFormData] = useState({
    projectId: "",
    date: "",
    maxSlots: 5,
  });

  // Queries
  const { data: projects = [] } = trpc.projects.list.useQuery();
  const [slots, setSlots] = React.useState<any[]>([]);

  // Mutations
  const setSlotsMutation = trpc.leaveSlots.setMaxSlots.useMutation({
    onSuccess: () => {
      toast.success("Leave slot configured successfully");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to configure slot: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({ projectId: "", date: "", maxSlots: 5 });
    setEditingId(null);
    setSlots([]);
  };

  const handleOpenDialog = (slot?: any) => {
    if (slot) {
      setEditingId(slot.id);
      setFormData({
        projectId: slot.projectId,
        date: new Date(slot.date).toISOString().split("T")[0],
        maxSlots: slot.maxSlots,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId || !formData.date || formData.maxSlots <= 0) {
      toast.error("All fields are required");
      return;
    }

    try {
      await setSlotsMutation.mutateAsync({
        projectId: parseInt(formData.projectId),
        date: formData.date,
        maxSlots: formData.maxSlots,
      });
    } catch (error) {
      console.error("Failed to save slot:", error);
    }
  };

  const handleDelete = (slotId: number, date: string) => {
    toast.info("Delete functionality not yet available. Use edit to change slot values.");
  };

  const handleEdit = (slot: any) => {
    handleOpenDialog(slot);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Manage Leave Slots</h1>
            <p className="text-gray-600 mt-2">Set daily leave limits per project</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Slot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Leave Slot" : "Create Leave Slot"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Update slot information" : "Set daily leave limits for a project"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Project</label>
                  <Select value={formData.projectId} onValueChange={(value) => setFormData({ ...formData, projectId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={String(project.id)}>
                          {project.projectName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Slots</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.maxSlots}
                    onChange={(e) => setFormData({ ...formData, maxSlots: parseInt(e.target.value) })}
                    placeholder="5"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
              <Button type="submit" disabled={setSlotsMutation.isPending}>
                {editingId ? "Update Slot" : "Create Slot"}
              </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Slots Configuration</CardTitle>
            <CardDescription>Manage leave slots for selected project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Project</label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project to view slots" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={String(project.id)}>
                      {project.projectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProject ? (
              slots.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No slots configured for this project.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">Max Slots</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slots.map((slot: any) => (
                        <tr key={slot.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{new Date(slot.date).toLocaleDateString()}</td>
                          <td className="py-3 px-4">{slot.maxSlots}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(slot)}
                                title="Edit slot"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(slot.id, new Date(slot.date).toLocaleDateString())}
                                title="Delete slot"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="text-center py-8 text-gray-500">Select a project to view and manage slots.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
