import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, Edit2 } from "lucide-react";

interface LeaveType {
  id: number;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
}

export default function ManageLeaveTypes() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([
    { id: 1, name: "Vacation", description: "Annual vacation days", color: "#3B82F6", isActive: true },
    { id: 2, name: "Sick Leave", description: "Medical/sick leave", color: "#EF4444", isActive: true },
    { id: 3, name: "Personal", description: "Personal days", color: "#F59E0B", isActive: true },
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Leave type name is required");
      return;
    }

    if (editingId) {
      setLeaveTypes((prev) =>
        prev.map((lt) =>
          lt.id === editingId
            ? { ...lt, name: formData.name, description: formData.description, color: formData.color }
            : lt
        )
      );
      toast.success("Leave type updated successfully");
      setEditingId(null);
    } else {
      const newLeaveType: LeaveType = {
        id: Math.max(...leaveTypes.map((lt) => lt.id), 0) + 1,
        name: formData.name,
        description: formData.description,
        color: formData.color,
        isActive: true,
      };
      setLeaveTypes((prev) => [...prev, newLeaveType]);
      toast.success("Leave type created successfully");
    }

    setFormData({ name: "", description: "", color: "#3B82F6" });
    setIsOpen(false);
  };

  const handleEdit = (leaveType: LeaveType) => {
    setFormData({
      name: leaveType.name,
      description: leaveType.description || "",
      color: leaveType.color,
    });
    setEditingId(leaveType.id);
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    setLeaveTypes((prev) => prev.filter((lt) => lt.id !== id));
    toast.success("Leave type deleted");
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setFormData({ name: "", description: "", color: "#3B82F6" });
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Types</h1>
          <p className="text-gray-600 mt-1">Manage leave types and their settings</p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Leave Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Leave Type" : "Create Leave Type"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Update the leave type details" : "Add a new leave type to your system"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Leave Type Name *
                </label>
                <Input
                  type="text"
                  name="name"
                  placeholder="e.g., Vacation, Sick Leave"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  placeholder="Optional description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <Input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                {editingId ? "Update Leave Type" : "Create Leave Type"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Types</CardTitle>
          <CardDescription>
            Manage all leave types in your system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leaveTypes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No leave types created yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveTypes.map((leaveType) => (
                    <TableRow key={leaveType.id}>
                      <TableCell className="font-medium">{leaveType.name}</TableCell>
                      <TableCell className="text-gray-600">{leaveType.description || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: leaveType.color }}
                          />
                          <span className="text-sm text-gray-600">{leaveType.color}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(leaveType)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(leaveType.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
