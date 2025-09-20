import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTeams } from "@/hooks/useTeams";
import { Id } from "../../../convex/_generated/dataModel";

// Form validation schema
const teamFormSchema = z.object({
  name: z.string()
    .min(1, "Team name is required")
    .max(50, "Team name must be 50 characters or less")
    .regex(/^[a-zA-Z0-9\s\-']+$/, "Team name contains invalid characters"),
  season: z.string()
    .regex(/^\d{4} (Spring|Summer|Fall|Winter)$/, 'Season must be in format "YYYY Season" (e.g., "2025 Spring")')
});

type TeamFormData = z.infer<typeof teamFormSchema>;

interface TeamFormProps {
  team?: {
    _id: Id<"teams">;
    name: string;
    season: string;
  };
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function TeamForm({ team, onSuccess, trigger }: TeamFormProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createTeam, updateTeam } = useTeams();
  const isEditing = !!team;

  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: team?.name || "",
      season: team?.season || "",
    },
  });

  const onSubmit = async (data: TeamFormData) => {
    try {
      setError(null);
      setIsSubmitting(true);

      if (isEditing) {
        await updateTeam(team._id, {
          name: data.name !== team.name ? data.name : undefined,
          season: data.season !== team.season ? data.season : undefined,
        });
      } else {
        await createTeam(data.name, data.season);
      }

      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setError(null);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant={isEditing ? "outline" : "default"}>
            {isEditing ? "Edit Team" : "Add Team"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Team" : "Create New Team"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update your team's information below."
              : "Add a new team to start managing players and rosters."
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Eagles, Lightning, Dragons"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="season"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Season</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., 2025 Spring"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : (isEditing ? "Update Team" : "Create Team")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}