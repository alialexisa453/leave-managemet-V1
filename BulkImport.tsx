import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, Download, CheckCircle, AlertCircle } from "lucide-react";

interface UserRow {
  name: string;
  email: string;
  role: "staff" | "supervisor" | "admin" | "hr";
  projectId?: string;
  leaveBalance?: string;
}

export default function BulkImport() {
  const [csvData, setCsvData] = useState<UserRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);

  const projectsQuery = trpc.projects.list.useQuery();
  const createUserMutation = trpc.users.create.useMutation();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split("\n").filter((line) => line.trim());

        // Skip header row
        const rows = lines.slice(1);
        const data: UserRow[] = [];

        rows.forEach((line, index) => {
          const [name, email, role, projectId, leaveBalance] = line
            .split(",")
            .map((col) => col.trim());

          if (name && email && role) {
            data.push({
              name,
              email,
              role: role as any,
              projectId,
              leaveBalance,
            });
          }
        });

        setCsvData(data);
        toast.success(`Loaded ${data.length} users from CSV`);
      } catch (error) {
        toast.error("Failed to parse CSV file");
        console.error(error);
      }
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (csvData.length === 0) {
      toast.error("No data to import");
      return;
    }

    setImporting(true);
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const row of csvData) {
      try {
        await createUserMutation.mutateAsync({
          name: row.name,
          email: row.email,
          role: row.role,
          projectId: row.projectId ? parseInt(row.projectId) : undefined,
          leaveBalance: row.leaveBalance ? parseInt(row.leaveBalance) : 20,
          companyId: `${row.name.toLowerCase().replace(/\s+/g, ".")}.${Date.now()}`,
        });
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${row.name}: ${error.message}`);
      }
    }

    setImportResults(results);
    setImporting(false);

    if (results.failed === 0) {
      toast.success(`Successfully imported ${results.success} users`);
      setCsvData([]);
      setFileName("");
    } else {
      toast.error(
        `Imported ${results.success} users, ${results.failed} failed`
      );
    }
  };

  const downloadTemplate = () => {
    const template = `name,email,role,projectId,leaveBalance
John Doe,john@example.com,staff,1,20
Jane Smith,jane@example.com,supervisor,1,25
Admin User,admin@example.com,admin,,30`;

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(template)
    );
    element.setAttribute("download", "users_template.csv");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const projects = projectsQuery.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bulk User Import</h1>
          <p className="text-gray-600 mt-2">Import multiple users at once using a CSV file</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Upload CSV</CardTitle>
              <CardDescription>Import users from a CSV file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csv-file">CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={importing}
                />
                {fileName && (
                  <p className="text-sm text-gray-600">Loaded: {fileName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Button
                  onClick={downloadTemplate}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>

              <Button
                onClick={handleImport}
                disabled={csvData.length === 0 || importing}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {importing ? "Importing..." : "Import Users"}
              </Button>
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                {csvData.length} users ready to import
              </CardDescription>
            </CardHeader>
            <CardContent>
              {csvData.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.slice(0, 5).map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{row.name}</TableCell>
                          <TableCell className="text-sm">{row.email}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {row.role}
                            </span>
                          </TableCell>
                          <TableCell>
                            {row.projectId
                              ? projects.find((p) => p.id.toString() === row.projectId)
                                  ?.projectName || row.projectId
                              : "-"}
                          </TableCell>
                          <TableCell>{row.leaveBalance || "20"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {csvData.length > 5 && (
                    <p className="text-sm text-gray-600 mt-2">
                      ... and {csvData.length - 5} more users
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-gray-500">
                  <p>Upload a CSV file to preview users</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Import Results */}
        {importResults && (
          <Card
            className={
              importResults.failed === 0
                ? "border-green-200 bg-green-50"
                : "border-yellow-200 bg-yellow-50"
            }
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {importResults.failed === 0 ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Import Successful</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span>Import Completed with Errors</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">
                <strong>Success:</strong> {importResults.success} users imported
              </p>
              {importResults.failed > 0 && (
                <>
                  <p className="text-sm">
                    <strong>Failed:</strong> {importResults.failed} users
                  </p>
                  <div className="mt-3 space-y-1">
                    {importResults.errors.slice(0, 5).map((error: string, idx: number) => (
                      <p key={idx} className="text-xs text-red-600">
                        {error}
                      </p>
                    ))}
                    {importResults.errors.length > 5 && (
                      <p className="text-xs text-gray-600">
                        ... and {importResults.errors.length - 5} more errors
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>CSV Format</CardTitle>
            <CardDescription>Required columns for bulk import</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>name:</strong> User's full name (required)
            </p>
            <p>
              <strong>email:</strong> User's email address (required)
            </p>
            <p>
              <strong>role:</strong> One of: staff, supervisor, admin, hr (required)
            </p>
            <p>
              <strong>projectId:</strong> Project ID number (optional)
            </p>
            <p>
              <strong>leaveBalance:</strong> Initial leave balance in days (default: 20)
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
