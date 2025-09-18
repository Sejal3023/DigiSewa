import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Activity, 
  Search, 
  Filter, 
  Calendar,
  User,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminActivity {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  target_application_id: string | null;
  department: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  admin_name?: string;
  admin_email?: string;
}

const ActivityMonitor = () => {
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
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

  const actionTypes = [
    "application_status_changed",
    "approval_processed", 
    "role_assigned",
    "role_revoked",
    "user_created",
    "user_updated",
    "application_approved",
    "application_rejected"
  ];

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      // Get activities with admin user details
      const { data: activitiesData, error } = await supabase
        .from('admin_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      // Get admin user details separately
      const adminIds = [...new Set(activitiesData?.map(a => a.admin_id))];
      const { data: admins } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', adminIds);

      // Combine activities with admin details
      const enrichedActivities = activitiesData?.map(activity => {
        const admin = admins?.find(a => a.id === activity.admin_id);
        return {
          ...activity,
          admin_name: admin?.name || 'Unknown Admin',
          admin_email: admin?.email || 'No email',
          ip_address: activity.ip_address ? String(activity.ip_address) : null,
          user_agent: activity.user_agent ? String(activity.user_agent) : null
        };
      }) || [];

      setActivities(enrichedActivities as AdminActivity[]);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Error",
        description: "Failed to load admin activities",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "application_approved":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "application_rejected":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "role_assigned":
      case "role_revoked":
        return <Shield className="h-4 w-4 text-primary" />;
      case "application_status_changed":
        return <FileText className="h-4 w-4 text-warning" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "application_approved":
        return <Badge className="bg-success text-success-foreground">Approved</Badge>;
      case "application_rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "role_assigned":
        return <Badge className="bg-blue-600 text-white">Role Assigned</Badge>;
      case "role_revoked":
        return <Badge className="bg-orange-600 text-white">Role Revoked</Badge>;
      case "application_status_changed":
        return <Badge className="bg-warning text-warning-foreground">Status Changed</Badge>;
      case "approval_processed":
        return <Badge className="bg-primary text-primary-foreground">Approval Processed</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const formatActionDescription = (activity: AdminActivity) => {
    const { action, details, target_application_id, target_user_id } = activity;
    
    switch (action) {
      case "application_status_changed":
        return `Changed application ${target_application_id?.slice(0, 8)}... status from ${details?.old_status} to ${details?.new_status}`;
      case "approval_processed":
        return `Processed approval for application ${target_application_id?.slice(0, 8)}... - ${details?.remarks || 'No remarks'}`;
      case "role_assigned":
        return `Assigned ${details?.role} role${details?.department ? ` in ${details.department}` : ''} to user ${target_user_id?.slice(0, 8)}...`;
      case "role_revoked":
        return `Revoked role from user ${target_user_id?.slice(0, 8)}...`;
      case "application_approved":
        return `Approved application ${target_application_id?.slice(0, 8)}...`;
      case "application_rejected":
        return `Rejected application ${target_application_id?.slice(0, 8)}...`;
      default:
        return `Performed ${action}`;
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.admin_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatActionDescription(activity).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === "all" || activity.action === actionFilter;
    const matchesDepartment = departmentFilter === "all" || activity.department === departmentFilter;
    
    return matchesSearch && matchesAction && matchesDepartment;
  });

  return (
    <div className="space-y-6">
      {/* Activity Monitor Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Administrative Activity Monitor
          </CardTitle>
          <p className="text-muted-foreground">
            Real-time monitoring of all administrative actions across the system
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities, admins, or actions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actionTypes.map(action => (
                  <SelectItem key={action} value={action}>
                    {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities ({filteredActivities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading activities...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Administrator</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(activity.action)}
                        {getActionBadge(activity.action)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{activity.admin_name}</p>
                        <p className="text-sm text-muted-foreground">{activity.admin_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{formatActionDescription(activity)}</p>
                      {activity.ip_address && (
                        <p className="text-xs text-muted-foreground mt-1">
                          IP: {activity.ip_address}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {activity.department || 
                        <span className="text-muted-foreground">System Wide</span>
                      }
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{new Date(activity.created_at).toLocaleDateString()}</p>
                        <p className="text-muted-foreground">
                          {new Date(activity.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {!loading && filteredActivities.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No activities found matching your filters
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityMonitor;