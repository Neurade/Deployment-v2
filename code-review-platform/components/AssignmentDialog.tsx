import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function AssignmentDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
  errors,
  form,
  setForm,
  handleFileChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  errors: Record<string, string>;
  form: { assignment_name: string; description: string; assignment_file: File | null };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full min-h-[60vh]">
        <DialogHeader>
          <DialogTitle>Create Assignment</DialogTitle>
          <DialogDescription>Fill in the details for the new assignment.</DialogDescription>
        </DialogHeader>
        {errors.general && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-2">
            {errors.general}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <label htmlFor="assignment_name" className="text-sm font-medium">Assignment Name</label>
          <Input
            id="assignment_name"
            name="assignment_name"
            value={form.assignment_name}
            onChange={e => setForm((f: any) => ({ ...f, assignment_name: e.target.value }))}
            required
          />
          {errors.assignment_name && (
            <p className="text-sm text-red-600">{errors.assignment_name}</p>
          )}
          <Textarea
            placeholder="Description (optional)"
            name="description"
            value={form.description}
            onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))}
          />
          <div className="space-y-2">
            <label htmlFor="assignment_file" className="text-sm font-medium">
              Assignment File
            </label>
            <input
              id="assignment_file"
              type="file"
              accept=".md,.txt"
              onChange={handleFileChange}
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-500">
              Only Markdown (.md) or text (.txt) files are accepted
            </p>
            {errors.assignment_file && (
              <p className="text-sm text-red-600">{errors.assignment_file}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              Create Assignment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}