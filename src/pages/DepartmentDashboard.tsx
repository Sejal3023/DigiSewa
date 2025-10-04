import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ApplicationDetailsDialog } from '@/components/ApplicationDetailsDialog';
import { Search, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Application {
  id: string;
  user_id: string;
  license_type: string;
  status: string;
  submission_date: string;
  blockchain_tx_hash?: string;
  ipfs_hash?: string;
}

export default function DepartmentDashboard() {
  const { user } = useAuth();
  const { role, loading: roleLoading, isDepartment } = useAdminRole();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [department, setDepartment] = useState<string | null>(null);

  useEffect(() => {
    if (!roleLoading && user && role !== 'department') {
      toast({
        title: "Access Denied",
        description: "You don't have department privileges.",
        variant: "destructive"
      });
      navigate('/dashboard');
    }
  }, [role, roleLoading, user, navigate, toast]);

  useEffect(() => {
    if (user && isDepartment) {
      fetchDepartment();
    }
  }, [user, isDepartment]);

  useEffect(() => {
    if (department) {
      fetchApplications();
    }
  }, [department, statusFilter]);

  const fetchDepartment = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('department')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setDepartment(data?.department || null);
    } catch (error) {
      console.error('Error fetching department:', error);
      toast({
        title: "Error",
        description: "Failed to fetch department information.",
        variant: "destructive"
      });
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('applications')
        .select('*')
        .order('submission_date', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch applications.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplication = (application: Application) => {
    setSelectedApplication(application);
    setDialogOpen(true);
  };

  const handleApproveApplication = async (applicationId: string, remarks: string) => {
    if (!department) return;

    try {
      // Insert approval record
      const { error: approvalError } = await supabase
        .from('approvals')
        .insert({
          application_id: applicationId,
          approved_by: user?.id,
          department_name: department,
          remarks: remarks || 'Approved by department'
        });

      if (approvalError) throw approvalError;

      // Update application status
      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: 'approved' })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // Log activity
      await supabase.from('admin_activities').insert({
        admin_id: user?.id,
        action: 'application_approved',
        target_application_id: applicationId,
        department: department,
        details: { remarks }
      });

      toast({
        title: "Success",
        description: "Application approved successfully.",
      });

      setDialogOpen(false);
      fetchApplications();
    } catch (error) {
      console.error('Error approving application:', error);
      toast({
        title: "Error",
        description: "Failed to approve application.",
        variant: "destructive"
      });
    }
  };

  const handleRejectApplication = async (applicationId: string, remarks: string) => {
    if (!department) return;

    try {
      // Update application status
      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: 'rejected' })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // Insert approval record with rejection
      const { error: approvalError } = await supabase
        .from('approvals')
        .insert({
          application_id: applicationId,
          approved_by: user?.id,
          department_name: department,
          remarks: remarks || 'Rejected by department'
        });

      if (approvalError) throw approvalError;

      // Log activity
      await supabase.from('admin_activities').insert({
        admin_id: user?.id,
        action: 'application_rejected',
        target_application_id: applicationId,
        department: department,
        details: { remarks }
      });

      toast({
        title: "Success",
        description: "Application rejected.",
      });

      setDialogOpen(false);
      fetchApplications();
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast({
        title: "Error",
        description: "Failed to reject application.",
        variant: "destructive"
      });
    }
  };

  const handleSetProcessing = async (applicationId: string, remarks: string) => {
    if (!department) return;

    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'processing' })
        .eq('id', applicationId);

      if (error) throw error;

      // Log activity
      await supabase.from('admin_activities').insert({
        admin_id: user?.id,
        action: 'application_set_processing',
        target_application_id: applicationId,
        department: department,
        details: { remarks }
      });

      toast({
        title: "Success",
        description: "Application status updated to processing.",
      });

      setDialogOpen(false);
      fetchApplications();
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: "Error",
        description: "Failed to update application status.",
        variant: "destructive"
      });
    }
  };

  const filteredApplications = applications.filter(app =>
    app.license_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      processing: "default",
      approved: "default",
      rejected: "destructive"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <FileText className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Department Dashboard</h1>
          <p className="text-muted-foreground">
            {department ? `${department} Department` : 'Manage applications for your department'}
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Application Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by application ID or license type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading applications...</p>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No applications found.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Application ID</TableHead>
                      <TableHead>License Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submission Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-mono text-sm">{app.id.slice(0, 8)}...</TableCell>
                        <TableCell>{app.license_type}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(app.status)}
                            {getStatusBadge(app.status)}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(app.submission_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewApplication(app)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />

      {selectedApplication && (
        <ApplicationDetailsDialog
          application={selectedApplication}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onApprove={(remarks) => handleApproveApplication(selectedApplication.id, remarks)}
          onReject={(remarks) => handleRejectApplication(selectedApplication.id, remarks)}
          onSetProcessing={() => handleSetProcessing(selectedApplication.id, '')}
        />
      )}
    </div>
  );
}
