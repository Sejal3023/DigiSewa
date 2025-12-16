import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  Save,
  X,
  Edit,
  Activity,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/apiService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";


const Profile = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    role: "citizen",
    created_at: "",
    total_applications: 0,
    approved: 0,
    pending: 0
  });

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    const fields = [
      userProfile.full_name,
      userProfile.email,
      userProfile.phone,
      userProfile.address,
      userProfile.city,
      userProfile.state,
      userProfile.pincode
    ];
    const filled = fields.filter(f => f && f.trim()).length;
    return Math.round((filled / fields.length) * 100);
  };

  const profileCompletion = calculateCompletion();

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiService.getProfile();
        if (response.success) {
          setUserProfile({
            full_name: response.data.profile.full_name || '',
            email: response.data.profile.email || '',
            phone: response.data.profile.phone || '',
            address: response.data.profile.address || '',
            city: response.data.profile.city || '',
            state: response.data.profile.state || '',
            pincode: response.data.profile.pincode || '',
            role: response.data.profile.role || 'citizen',
            created_at: response.data.profile.created_at || '',
            total_applications: parseInt(response.data.stats.total_applications) || 0,
            approved: parseInt(response.data.stats.approved) || 0,
            pending: parseInt(response.data.stats.pending) || 0
          });
        }

        // Fetch activity log
        const activityResponse = await apiService.getUserActivity();
        if (activityResponse.success) {
          setActivityLog(activityResponse.data || []);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [session, toast]);

  const handleSave = async () => {
    try {
      const response = await apiService.updateProfile({
        full_name: userProfile.full_name,
        phone: userProfile.phone,
        address: userProfile.address,
        city: userProfile.city,
        state: userProfile.state,
        pincode: userProfile.pincode
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        setIsEditing(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    window.location.reload();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-800">Administrator</Badge>;
      case 'officer':
        return <Badge className="bg-blue-100 text-blue-800">Officer</Badge>;
      case 'department':
        return <Badge className="bg-purple-100 text-purple-800">Department</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-800">Citizen</Badge>;
    }
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'PROFILE_UPDATE':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'LOGIN':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'APPLICATION_SUBMIT':
        return <Award className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header userRole={userProfile.role as 'citizen' | 'officer' | 'admin'} />
        <main className="pt-8 pb-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header userRole={userProfile.role as 'citizen' | 'officer' | 'admin'} />
      
      <main className="pt-8 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your account information and preferences</p>
          </div>

          {/* Profile Header Card */}
          <Card className="mb-6 border-t-4 border-t-primary">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-3xl font-bold text-white">
                    {userProfile.full_name?.charAt(0) || userProfile.email?.charAt(0) || 'U'}
                  </div>
                  <Badge className="absolute -bottom-1 -right-1 bg-green-500">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold">{userProfile.full_name || 'User'}</h2>
                  <p className="text-muted-foreground">{userProfile.email}</p>
                  <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                    {getRoleBadge(userProfile.role)}
                    {userProfile.created_at && (
                      <Badge variant="outline">
                        <Calendar className="h-3 w-3 mr-1" />
                        Member since {new Date(userProfile.created_at).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Profile Completion */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Profile Completion</span>
                      <span className="text-sm text-muted-foreground">{profileCompletion}%</span>
                    </div>
                    <Progress value={profileCompletion} className="h-2" />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{userProfile.total_applications}</div>
                    <div className="text-xs text-muted-foreground">Applications</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{userProfile.approved}</div>
                    <div className="text-xs text-muted-foreground">Approved</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{userProfile.pending}</div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Personal Information
                    </CardTitle>
                    {!isEditing ? (
                      <Button variant="outline" onClick={() => setIsEditing(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={handleCancel}>
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      {isEditing ? (
                        <Input
                          id="name"
                          value={userProfile.full_name}
                          onChange={(e) => setUserProfile(prev => ({ ...prev, full_name: e.target.value }))}
                        />
                      ) : (
                        <p className="text-sm p-2 bg-muted rounded-md">{userProfile.full_name || "Not provided"}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">{userProfile.email}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+91 1234567890"
                          value={userProfile.phone}
                          onChange={(e) => setUserProfile(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm">{userProfile.phone || "Not provided"}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Account Type</Label>
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        {getRoleBadge(userProfile.role)}
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Address *</Label>
                      {isEditing ? (
                        <Textarea
                          id="address"
                          placeholder="Enter your full address"
                          value={userProfile.address}
                          onChange={(e) => setUserProfile(prev => ({ ...prev, address: e.target.value }))}
                          rows={3}
                        />
                      ) : (
                        <p className="text-sm p-2 bg-muted rounded-md">{userProfile.address || "Not provided"}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      {isEditing ? (
                        <Input
                          id="city"
                          placeholder="City"
                          value={userProfile.city}
                          onChange={(e) => setUserProfile(prev => ({ ...prev, city: e.target.value }))}
                        />
                      ) : (
                        <p className="text-sm p-2 bg-muted rounded-md">{userProfile.city || "Not provided"}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      {isEditing ? (
                        <Input
                          id="state"
                          placeholder="State"
                          value={userProfile.state}
                          onChange={(e) => setUserProfile(prev => ({ ...prev, state: e.target.value }))}
                        />
                      ) : (
                        <p className="text-sm p-2 bg-muted rounded-md">{userProfile.state || "Not provided"}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pincode">Pincode *</Label>
                      {isEditing ? (
                        <Input
                          id="pincode"
                          placeholder="123456"
                          value={userProfile.pincode}
                          onChange={(e) => setUserProfile(prev => ({ ...prev, pincode: e.target.value }))}
                        />
                      ) : (
                        <p className="text-sm p-2 bg-muted rounded-md">{userProfile.pincode || "Not provided"}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activityLog.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No recent activity</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activityLog.map((activity, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                          <div className="mt-1">
                            {getActivityIcon(activity.action)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{activity.description || activity.action}</p>
                            <div className="flex items-center space-x-2 mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(activity.created_at).toLocaleString()}</span>
                              {activity.ip_address && (
                                <>
                                  <span>•</span>
                                  <span>IP: {activity.ip_address}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

           <TabsContent value="security" className="space-y-6">
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center">
        <Shield className="h-5 w-5 mr-2" />
        Security Settings
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-4">
        {/* Change Password */}
        <Dialog>
          <DialogTrigger asChild>
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <div>
                <h4 className="font-medium">Password</h4>
                <p className="text-sm text-muted-foreground">Last updated 30 days ago</p>
              </div>
              <Button variant="outline">Change Password</Button>
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Button className="w-full">Update Password</Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* 2FA */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium">Two-Factor Authentication</h4>
            <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
          </div>
          <Badge variant="outline" className="text-gray-500">Coming Soon</Badge>
        </div>

        {/* Active Sessions */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-3">Active Sessions</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="font-medium">Current Session</p>
                  <p className="text-xs text-muted-foreground">Windows • Chrome • {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <Badge className="bg-green-500">Active</Badge>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</TabsContent>


          <TabsContent value="preferences" className="space-y-6">
  <Card>
    <CardHeader>
      <CardTitle>Notification Preferences</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium">Email Notifications</h4>
            <p className="text-sm text-muted-foreground">Receive updates about your applications</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
        
        <Separator />
        
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium">SMS Notifications</h4>
            <p className="text-sm text-muted-foreground">Get SMS alerts for important updates</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <Separator />

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium">Application Status Updates</h4>
            <p className="text-sm text-muted-foreground">Get notified when application status changes</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </div>
    </CardContent>
  </Card>
</TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;
