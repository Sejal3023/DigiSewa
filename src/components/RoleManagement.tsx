import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  UserPlus, 
  Shield, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Users,
  AlertTriangle,
  Search,
  Filter
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface RoleAssignment {
  id: string;
  user_id: string;
  role: string;
  department: string | null;
  assigned_by: string;
  assigned_at: string;
  is_active: boolean;
  users: User;
}

const RoleManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const departments = [
    "Municipal Corporation",
    "RTO", 
    "Food & Drug Administration",
    "Police Department",
    "Public Works Department",
    "Revenue Department",
    "Education Department",
    "Health Department"
  ];

  const availableRoles = [
    { value: "admin", label: "Administrator", description: "Full system access" },
    { value: "department_head", label: "Department Head", description: "Manages department operations" },
    { value: "officer", label: "Officer", description: "Processes applications" },
    { value: "staff", label: "Staff", description: "Basic administrative tasks" }
  ];

  useEffect(() => {
    fetchUsers();
    fetchRoleAssignments();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    }
  };

  const fetchRoleAssignments = async () => {
    try {
      setLoading(true);
      
      // Get role assignments first
      const { data: assignments, error: assignmentError } = await supabase
        .from('role_assignments')
        .select('*')
        .eq('is_active', true)
        .order('assigned_at', { ascending: false });

      if (assignmentError) throw assignmentError;

      // Get user details for the assignments
      if (assignments && assignments.length > 0) {
        const userIds = assignments.map(a => a.user_id);
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, email, role, created_at')
          .in('id', userIds);

        if (userError) throw userError;

        // Combine assignments with user data
        const enrichedAssignments = assignments.map(assignment => ({
          ...assignment,
          users: userData?.find(u => u.id === assignment.user_id) || {
            id: assignment.user_id,
            name: 'Unknown User',
            email: 'No email',
            role: 'unknown',
            created_at: new Date().toISOString()
          }
        }));

        setRoleAssignments(enrichedAssignments);
      } else {
        setRoleAssignments([]);
      }
    } catch (error) {
      console.error('Error fetching role assignments:', error);
      toast({
        title: "Error",
        description: "Failed to load role assignments",
        variant: "destructive",
      });
      setRoleAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async () => {
    if (!selectedUser || !newRole) {
      toast({
        title: "Missing Information",
        description: "Please select a user and role",
        variant: "destructive",
      });
      return;
    }

    try {
      // Deactivate existing role assignments for this user
      await supabase
        .from('role_assignments')
        .update({ is_active: false })
        .eq('user_id', selectedUser.id);

      // Create new role assignment
      const { error: assignError } = await supabase
        .from('role_assignments')
        .insert({
          user_id: selectedUser.id,
          role: newRole,
          department: newDepartment || null,
          assigned_by: user?.id
        });

      if (assignError) throw assignError;

      // Update user's primary role
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', selectedUser.id);

      if (updateError) throw updateError;

      // Log activity
      await supabase
        .from('admin_activities')
        .insert({
          admin_id: user?.id,
          action: 'role_assigned',
          target_user_id: selectedUser.id,
          department: newDepartment || null,
          details: { role: newRole, department: newDepartment }
        });

      await fetchUsers();
      await fetchRoleAssignments();
      setIsAssignDialogOpen(false);
      setSelectedUser(null);
      setNewRole("");
      setNewDepartment("");
      
      toast({
        title: "Role Assigned",
        description: `Successfully assigned ${newRole} role to ${selectedUser.name}`,
      });
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: "Error",
        description: "Failed to assign role. Please try again.",
        variant: "destructive",
      });
    }
  };

  const revokeRole = async (assignmentId: string, userId: string) => {
    try {
      // Deactivate role assignment
      const { error: revokeError } = await supabase
        .from('role_assignments')
        .update({ is_active: false })
        .eq('id', assignmentId);

      if (revokeError) throw revokeError;

      // Reset user role to citizen
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'citizen' })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Log activity
      await supabase
        .from('admin_activities')
        .insert({
          admin_id: user?.id,
          action: 'role_revoked',
          target_user_id: userId,
          details: { assignment_id: assignmentId }
        });

      await fetchUsers();
      await fetchRoleAssignments();
      
      toast({
        title: "Role Revoked",
        description: "Successfully revoked user role",
      });
    } catch (error) {
      console.error('Error revoking role:', error);
      toast({
        title: "Error",
        description: "Failed to revoke role. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-purple-600 text-white">Super Admin</Badge>;
      case "admin":
        return <Badge className="bg-primary text-primary-foreground">Administrator</Badge>;
      case "department_head":
        return <Badge className="bg-blue-600 text-white">Department Head</Badge>;
      case "officer":
        return <Badge className="bg-green-600 text-white">Officer</Badge>;
      case "staff":
        return <Badge className="bg-orange-600 text-white">Staff</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const filteredAssignments = roleAssignments.filter(assignment => {
    const matchesSearch = assignment.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || assignment.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const eligibleUsers = users.filter(u => u.role === 'citizen' || u.role === 'admin');

  return (
    <div className="space-y-6">
      {/* Role Assignment Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Role Management System
          </CardTitle>
          <p className="text-muted-foreground">
            Assign and manage user roles across government departments
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users or roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="department_head">Department Head</SelectItem>
                  <SelectItem value="officer">Officer</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Role
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign New Role</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="user-select">Select User</Label>
                    <Select onValueChange={(value) => {
                      const user = eligibleUsers.find(u => u.id === value);
                      setSelectedUser(user || null);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleUsers.map(u => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name} ({u.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="role-select">Assign Role</Label>
                    <Select value={newRole} onValueChange={setNewRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map(role => (
                          <SelectItem key={role.value} value={role.value}>
                            <div>
                              <p className="font-medium">{role.label}</p>
                              <p className="text-sm text-muted-foreground">{role.description}</p>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="department-select">Department (Optional)</Label>
                    <Select value={newDepartment} onValueChange={setNewDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={assignRole}>
                      Assign Role
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Active Role Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Active Role Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading role assignments...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{assignment.users?.name}</p>
                        <p className="text-sm text-muted-foreground">{assignment.users?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(assignment.role)}
                    </TableCell>
                    <TableCell>
                      {assignment.department || 
                        <span className="text-muted-foreground">System Wide</span>
                      }
                    </TableCell>
                    <TableCell>
                      {new Date(assignment.assigned_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeRole(assignment.id, assignment.user_id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleManagement;