import { useState, useEffect, useMemo } from 'react';
import WalletConnect from '@/components/WalletConnect';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DepartmentHeader } from '@/components/DepartmentHeader';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ApplicationDetailsDialog } from '@/components/ApplicationDetailsDialog';
//import { decryptDocument } from '@/lib/crypto';
import { PDFViewerDialog } from '@/components/PDFViewerDialog';
import { decryptDocumentForViewing } from '@/lib/crypto';

import { 
  Search, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Car,
  Send,
  AlertCircle 
} from 'lucide-react';
import axios from 'axios';
import { ethers } from 'ethers';

import DigiSewaLicensesABI from '@/contracts/DigiSewaLicenses.json';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

interface Application {
  id: string;
  user_id: string;
  license_type: string;
  status: string;
  submission_date: string;
  blockchain_tx_hash?: string;
  ipfs_hash?: string;
  application_data?: any;
  current_department?: string;
  current_stage?: string; // ✅ ADD THIS LINE
  
}




export default function RTODepartment() {
  const DEPARTMENT_NAME = 'Regional Transport Office';
  const LICENSE_TYPE = 'vehicle-registration';

   const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  // Add state
const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
const [pdfUrl, setPdfUrl] = useState<string>('');
const [currentDocName, setCurrentDocName] = useState<string>('');
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [departmentStats, setDepartmentStats] = useState({
  totalApproved: 0,
  transferred: 0
});


  // ✅ FIXED: Create apiClient with dynamic token using interceptor
  const apiClient = useMemo(() => {
    const client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Interceptor to add token on every request
    client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('✅ Token added to request');
        } else {
          console.warn('⚠️ No token found in localStorage');
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return client;
  }, []);

  useEffect(() => {
    if (user) {
      checkDepartmentAccess();
      checkWalletConnection();
    }
  }, [user]);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  useEffect(() => {
  if (applications.length >= 0) {
    fetchDepartmentStats();
  }
}, [applications]);


  const checkDepartmentAccess = async () => {
    try {
      const response = await apiClient.get(`/users/${user?.id}/roles`);
      const userRole = response.data;

      if (!userRole || 
          (userRole.department !== DEPARTMENT_NAME && 
           userRole.role !== 'admin' && 
           userRole.role !== 'super_admin')) {
        toast({
          title: "Access Denied",
          description: "You don't have access to this department.",
          variant: "destructive"
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error checking access:', error);
    }
  };

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          setWalletAddress(accounts[0].address);
          setWalletConnected(true);
        }
      } catch (error) {
        console.error('Wallet connection check failed:', error);
      }
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);

      // ✅ Use admin API endpoint that filters by department
      let endpoint = `/admin/applications/recent?limit=100`;

      if (statusFilter !== 'all') {
        endpoint += `&status=${statusFilter}`;
      }

      const response = await apiClient.get(endpoint);
      setApplications(response.data.applications || []);

    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch applications from database.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

const fetchDepartmentStats = async () => {
  try {
    console.log('📊 Fetching approval stats for:', DEPARTMENT_NAME);
    
    // Get all-time approvals from the approvals table
    const response = await apiClient.get(`/approvals/stats/${encodeURIComponent(DEPARTMENT_NAME)}`);
    
    console.log('📊 Stats response:', response.data);
    
    if (response.data.success) {
      setDepartmentStats({
        totalApproved: response.data.totalApproved || 0,
        transferred: applications.filter(a => a.current_stage === 'transferred' || a.current_stage === 'transferred_to_super_admin').length
      });
      
      console.log('✅ Stats updated:', {
        totalApproved: response.data.totalApproved,
        transferred: applications.filter(a => a.current_stage === 'transferred' || a.current_stage === 'transferred_to_super_admin').length,
        RAW_RESPONSE: JSON.stringify(response.data)  // ✅ ADD THIS
      });
    }
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    // Fallback: count from current applications
    const approved = applications.filter(a => a.status === 'approved').length;
    const transferred = applications.filter(a => a.current_stage === 'transferred' || a.current_stage === 'transferred_to_super_admin').length;

    console.log('⚠️ Using fallback stats:', { approved, transferred });

    setDepartmentStats({
      totalApproved: approved,
      transferred: transferred
    });
  }
};




  const handleViewApplication = async (application: Application) => {
    try {
      const response = await apiClient.get(`/applications/${application.id}`);
      setSelectedApplication(response.data);
      setDialogOpen(true);
    } catch (error) {
      console.error('Error fetching application details:', error);
      toast({
        title: "Error",
        description: "Failed to load application details.",
        variant: "destructive"
      });
    }
  };

const handleApproveApplication = async (applicationId: string, remarks: string) => {
  console.log('═══════════════════════════════════════');
  console.log('🎯 APPROVAL STARTING (API MODE)');
  console.log('Application ID:', applicationId);
  console.log('═══════════════════════════════════════');

  // ✅ Use test wallet address for database (no blockchain)
  const currentWalletAddress = 'TEST_WALLET_' + Date.now();

  try {
    setProcessingAction(true);

    // Step 1: Create approval using the approvals API (this will trigger license generation if fully approved)
    console.log('📝 Step 1: Creating approval via API...');
    const approvalResponse = await apiClient.post('/approvals', {
      application_id: applicationId,
      department_name: DEPARTMENT_NAME,
      remarks: remarks || `Approved by ${DEPARTMENT_NAME}`,
      wallet_address: currentWalletAddress,
      approval_status: 'approved'
    });

    console.log('✅ Approval API response:', approvalResponse.data);

    // Check if license was generated
    if (approvalResponse.data.data?.license_generated) {
      toast({
        title: "✅ Approval & License Generated!",
        description: `Application approved and license created successfully!`,
      });
    } else {
      toast({
        title: "✅ Approval Complete!",
        description: `Application approved successfully!`,
      });
    }

    // Refresh data
    await fetchApplications();
    const updatedApp = await apiClient.get(`/applications/${applicationId}`);
    setSelectedApplication(updatedApp.data);

    console.log('═══════════════════════════════════════');
    console.log('✅✅✅ APPROVAL COMPLETE!');
    console.log('═══════════════════════════════════════');

  } catch (error: any) {
    console.log('═══════════════════════════════════════');
    console.log('❌❌❌ APPROVAL ERROR');
    console.log('Error:', error);
    console.log('Error message:', error.message);
    console.log('═══════════════════════════════════════');

    toast({
      title: "Approval Failed",
      description: error.response?.data?.error || error.message || "Unknown error occurred",
      variant: "destructive"
    });
  } finally {
    setProcessingAction(false);
  }
};


const handleRejectApplication = async (applicationId: string, remarks: string) => {
  console.log('═══════════════════════════════════════');
  console.log('🎯 REJECTION STARTING (API MODE)');
  console.log('Application ID:', applicationId);
  console.log('═══════════════════════════════════════');

  // Validate remarks for rejection
  if (!remarks || remarks.trim().length < 10) {
    toast({
      title: "Remarks Required",
      description: "Please provide detailed remarks for rejection (minimum 10 characters)",
      variant: "destructive"
    });
    return;
  }

  // ✅ Test wallet address
  const currentWalletAddress = 'TEST_WALLET_' + Date.now();

  try {
    setProcessingAction(true);

    // Step 1: Create rejection approval using the approvals API
    console.log('📝 Step 1: Creating rejection approval via API...');
    const approvalResponse = await apiClient.post('/approvals', {
      application_id: applicationId,
      department_name: DEPARTMENT_NAME,
      remarks: remarks,
      wallet_address: currentWalletAddress,
      approval_status: 'rejected'
    });

    console.log('✅ Rejection approval API response:', approvalResponse.data);

    toast({
      title: "✅ Application Rejected",
      description: "Application has been rejected successfully",
      variant: "destructive"
    });

    setDialogOpen(false);
    await fetchApplications();

    console.log('═══════════════════════════════════════');
    console.log('✅✅✅ REJECTION COMPLETE!');
    console.log('═══════════════════════════════════════');

  } catch (error: any) {
    console.error('═══════════════════════════════════════');
    console.error('❌❌❌ REJECTION ERROR');
    console.error('Error:', error);
    console.error('═══════════════════════════════════════');

    toast({
      title: "Rejection Failed",
      description: error.response?.data?.error || error.message || "Failed to reject application.",
      variant: "destructive"
    });
  } finally {
    setProcessingAction(false);
  }
};

const handleSetProcessing = async (applicationId: string, remarks: string) => {
  console.log('═══════════════════════════════════════');
  console.log('🎯 SET TO PROCESSING (DATABASE MODE)');
  console.log('Application ID:', applicationId);
  console.log('═══════════════════════════════════════');

  try {
    setProcessingAction(true);

    // Step 1: Update application status
    console.log('📝 Step 1: Setting application to processing...');
    await apiClient.patch(`/applications/${applicationId}`, {
      status: 'processing',
      current_stage: 'under_review'
    });
    console.log('✅ Application set to processing');

    /* ❌ ADMIN ACTIVITIES - COMMENTED OUT (route doesn't exist)
    await apiClient.post('/admin-activities', {
      action: 'application_set_processing',
      target_application_id: applicationId,
      department: DEPARTMENT_NAME,
      details: { remarks }
    });
    */
    console.log('✅ Admin activity logging skipped');

    toast({
      title: "✅ Status Updated",
      description: "Application is now under processing",
    });

    setDialogOpen(false);
    await fetchApplications();
    
    console.log('═══════════════════════════════════════');
    console.log('✅✅✅ SET TO PROCESSING COMPLETE!');
    console.log('═══════════════════════════════════════');

  } catch (error: any) {
    console.error('═══════════════════════════════════════');
    console.error('❌❌❌ PROCESSING ERROR');
    console.error('Error:', error);
    console.error('═══════════════════════════════════════');
    
    toast({
      title: "Update Failed",
      description: error.response?.data?.message || "Failed to update application status.",
      variant: "destructive"
    });
  } finally {
    setProcessingAction(false);
  }
};

const handleTransferToSuperAdmin = async (applicationId: string, remarks: string) => {
  console.log('═══════════════════════════════════════');
  console.log('🎯 TRANSFER TO SUPER ADMIN (DATABASE MODE)');
  console.log('Application ID:', applicationId);
  console.log('═══════════════════════════════════════');

  if (!remarks || remarks.trim().length < 10) {
    toast({
      title: "Remarks Required",
      description: "Please provide a reason for transferring (minimum 10 characters)",
      variant: "destructive"
    });
    return;
  }

  const currentWalletAddress = 'TEST_WALLET_' + Date.now();

  try {
    setProcessingAction(true);

    // Step 1: Update application - set status to 'transferred' and assign to super admin
    console.log('📝 Step 1: Transferring application to Super Admin...');
    await apiClient.patch(`/applications/${applicationId}`, {
      status: 'pending',  // Keep pending so super admin can see it
      current_stage: 'transferred_to_super_admin',
      responsible_dept: null,  // No specific department (goes to super admin)
      transfer_remarks: remarks,
      transferred_from: DEPARTMENT_NAME,
      transferred_at: new Date().toISOString()
    });
    console.log('✅ Application transferred');

    // Step 2: Create transfer record in approvals table
    console.log('📝 Step 2: Creating transfer record...');
    await apiClient.post('/approvals', {
      application_id: applicationId,
      department_name: DEPARTMENT_NAME,
      remarks: `Transferred to Super Admin: ${remarks}`,
      wallet_address: currentWalletAddress,
      approval_status: 'transferred'
    });
    console.log('✅ Transfer record created');

    toast({
      title: "✅ Transfer Complete!",
      description: "Application transferred to Super Admin successfully",
    });

    setDialogOpen(false);
    await fetchApplications();
    
    console.log('═══════════════════════════════════════');
    console.log('✅✅✅ TRANSFER COMPLETE!');
    console.log('═══════════════════════════════════════');

  } catch (error: any) {
    console.error('═══════════════════════════════════════');
    console.error('❌❌❌ TRANSFER ERROR');
    console.error('Error:', error);
    console.error('═══════════════════════════════════════');
    
    toast({
      title: "Transfer Failed",
      description: error.response?.data?.message || error.message || "Failed to transfer application.",
      variant: "destructive"
    });
  } finally {
    setProcessingAction(false);
  }
};


const handleViewDocument = async (documentId: string) => {
  try {
    const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 DOCUMENT VIEW DEBUG');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Document ID:', documentId);
    console.log('🔑 Token exists:', !!token);
    console.log('🔑 Token preview:', token ? token.substring(0, 30) + '...' : 'NO TOKEN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!token) {
      console.error('❌ NO TOKEN FOUND IN STORAGE');
      alert('No token found! Check console for details.');
      return;
    }
    
    console.log(`📥 Fetching document details for ID: ${documentId}`);
    
    // Step 1: Get document metadata
    const detailsResponse = await apiClient.get(`/documents/${documentId}`);
    
    console.log('📄 Response status:', detailsResponse.status);
    console.log('📄 Response data:', detailsResponse.data);
    
    if (!detailsResponse.data.success) {
      throw new Error(detailsResponse.data.message || 'Failed to fetch document details');
    }

    const docDetails = detailsResponse.data.data;
    console.log('✅ Document details received:', docDetails);
    
    // ✅ ADD THESE LOGS
    console.log('🔗 Wallet connected?', walletConnected);
    console.log('🔗 Wallet address:', walletAddress);
    
    // Step 2: LOG ON BLOCKCHAIN (BEFORE DECRYPTION) - OPTIONAL
    if (walletConnected && walletAddress) {
      console.log('📝 Starting blockchain logging...');
      
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          DigiSewaLicensesABI.abi,
          signer
        );

        const accessLog = {
          documentId: documentId,
          officerId: walletAddress,
          action: "VIEW_DOCUMENT",
          timestamp: Date.now(),
          department: DEPARTMENT_NAME,
          keysAccessed: true,
          decryptedOnClient: true
        };

        const logHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(accessLog)));

        console.log('📝 Sending blockchain transaction...');
        const tx = await contract.verifyDocument(documentId, logHash);
        
        toast({
          title: "Logging Access...",
          description: "Recording document access on blockchain",
        });

        console.log('⏳ Waiting for blockchain confirmation...');
        await tx.wait();
        console.log(`✅ Blockchain log recorded: ${tx.hash}`);

        await apiClient.post('/admin-activities', {
          action: 'document_viewed',
          target_document_id: documentId,
          department: DEPARTMENT_NAME,
          details: {
            blockchain_tx_hash: tx.hash,
            wallet_address: walletAddress,
            access_log: accessLog
          }
        });

      } catch (blockchainError: any) {
        console.error('⚠️ Blockchain logging failed (continuing anyway):', blockchainError);
        console.error('⚠️ Error message:', blockchainError.message);
        // Continue to view document even if blockchain logging fails
      }
    } else {
      console.log('⏭️ Skipping blockchain logging (wallet not connected)');
    }

    // Step 3: Get CID
    const cid = docDetails.cid || docDetails.ipfs_hash;
    console.log(`📥 Fetching encrypted file from IPFS CID: ${cid}`);
    
    // Step 4: Fetch encrypted file from IPFS proxy
    const encryptedResponse = await apiClient.get(`/documents/proxy/${cid}`, {
      responseType: 'arraybuffer',
    });
    
    console.log('📦 IPFS proxy response status:', encryptedResponse.status);
    
    if (encryptedResponse.status !== 200) {
      throw new Error(`Failed to fetch encrypted file: HTTP ${encryptedResponse.status}`);
    }

    const encryptedBuffer = encryptedResponse.data;
    console.log(`✅ Encrypted file fetched (${encryptedBuffer.byteLength} bytes)`);

    // Step 5: Decrypt the document
    console.log('🔐 Starting decryption...');
    console.log('🔐 AES Key preview:', docDetails.aesKey?.substring(0, 20) + '...');
    console.log('🔐 IV preview:', docDetails.iv?.substring(0, 20) + '...');
    
    const decryptedBuffer = await decryptDocumentForViewing(
      encryptedBuffer,
      docDetails.aesKey || docDetails.encryption_key,
      docDetails.iv
    );

    console.log(`✅ Document decrypted successfully (${decryptedBuffer.byteLength} bytes)`);

    // Step 6: Create blob and open in new tab
 // Step 6: Detect file type and handle accordingly
console.log('🚀 Detecting file type...');

// ✅ Detect file type from magic bytes
const header = new Uint8Array(decryptedBuffer.slice(0, 4));
const headerHex = Array.from(header).map(b => b.toString(16).padStart(2, '0')).join('');
console.log('📄 File header (hex):', headerHex);

let mimeType = 'application/octet-stream';
let fileName = docDetails.name || 'document';

// ✅ Detect file type
if (headerHex.startsWith('ffd8ff')) {
  mimeType = 'image/jpeg';
  console.log('📷 Detected: JPEG image');
} else if (headerHex.startsWith('89504e47')) {
  mimeType = 'image/png';
  console.log('🖼️ Detected: PNG image');
} else if (headerHex.startsWith('25504446')) {
  mimeType = 'application/pdf';
  console.log('📄 Detected: PDF document');
} else if (headerHex.startsWith('504b0304')) {
  mimeType = 'application/zip';
  console.log('📦 Detected: ZIP archive');
}

// Create blob with correct MIME type
const blob = new Blob([decryptedBuffer], { type: mimeType });
const url = URL.createObjectURL(blob);

// ✅ Handle different file types
if (mimeType.startsWith('image/')) {
  // For images, open in new tab
  const imageWindow = window.open(url, '_blank');
  if (!imageWindow) {
    toast({
      title: 'Blocked',
      description: 'Please allow popups to view the image',
      variant: 'destructive'
    });
  } else {
    toast({
      title: 'Success',
      description: 'Image opened in new tab'
    });
  }
  // Clean up after delay
  setTimeout(() => URL.revokeObjectURL(url), 10000);
} else if (mimeType === 'application/pdf') {
  // For PDFs, use PDF viewer dialog
  setPdfUrl(url);
  setCurrentDocName(fileName);
  setPdfViewerOpen(true);
  toast({
    title: 'Success',
    description: 'PDF loaded successfully'
  });
} else {
  // For other files, download
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast({
    title: 'Downloaded',
    description: 'File downloaded successfully'
  });
}

console.log('✅ Document handled successfully!');


    
    // Clean up blob URL after 1 minute
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      console.log('🧹 Blob URL cleaned up');
    }, 60000);
    
  } catch (error: any) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ VIEW DOCUMENT FAILED');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ Error type:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error status:', error.response?.status);
    console.error('❌ Full error:', error);
    console.error('❌ Stack trace:', error.stack);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    toast({
      title: "Error",
      description: `Failed to view document: ${error.message}`,
      variant: "destructive"
    });
  }
};

// Clean up blob URL when dialog closes
const handleClosePdfViewer = () => {
  if (pdfUrl) {
    URL.revokeObjectURL(pdfUrl);
  }
  setPdfViewerOpen(false);
  setPdfUrl('');
  setCurrentDocName('');
};



  const filteredApplications = applications.filter(app =>
    app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.user_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500 text-white">Approved</Badge>;
      case "processing":
        return <Badge className="bg-yellow-500 text-white">Processing</Badge>;
      case "pending":
        return <Badge className="bg-gray-500 text-white">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-500 text-white">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-gray-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DepartmentHeader />
      
      <main className="pt-8 pb-20">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Car className="h-10 w-10 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">{DEPARTMENT_NAME}</h1>
                <p className="text-muted-foreground">Manage {LICENSE_TYPE} applications with blockchain verification</p>
              </div>
            </div>
          </div>

          {!walletConnected && (
            <div className="mb-6 p-4 bg-muted/30 rounded-lg flex items-start gap-3 border-l-4 border-l-yellow-500">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900">MetaMask Wallet Required</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Please connect your MetaMask wallet to approve or reject applications.
                </p>
              </div>
            </div>
          )}

          <div className="mb-8">
            <WalletConnect />
            {walletConnected && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✅ Wallet Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Application Management</span>
                    <FileText className="h-5 w-5 text-primary" />
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by application ID or user ID..."
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
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading applications...</p>
                    </div>
                  ) : filteredApplications.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No applications found</h3>
                      <p className="text-muted-foreground">
                        {searchQuery ? 'Try adjusting your search' : 'New applications will appear here'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredApplications.map((app) => (
                        <Card 
                          key={app.id} 
                          className="border-l-4 border-l-primary/20 hover:border-l-primary transition-colors"
                        >
                          <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  {getStatusIcon(app.status)}
                                  <h3 className="font-semibold text-lg">{LICENSE_TYPE}</h3>
                                  {getStatusBadge(app.status)}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                                  <div>
                                    <span className="font-medium">Application ID:</span>
                                    <p className="font-mono">{app.id.slice(0, 12)}...</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Submitted:</span>
                                    <p>{new Date(app.submission_date).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Blockchain TX:</span>
                                    <p className="font-mono text-xs">
                                      {app.blockchain_tx_hash ? 
                                        `${app.blockchain_tx_hash.slice(0, 10)}...` : 
                                        'Pending'
                                      }
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleViewApplication(app)}
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Department Statistics</CardTitle>
                </CardHeader>
                <CardContent>
  <div className="space-y-4">
    {/* Current In Department Queue */}
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
      <div className="flex items-center space-x-2">
        <FileText className="h-5 w-5 text-blue-600" />
        <span className="text-sm text-muted-foreground">In {DEPARTMENT_NAME} Queue</span>
      </div>
      <span className="text-2xl font-bold">{applications.length}</span>
    </div>

    {/* Pending */}
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
      <div className="flex items-center space-x-2">
        <Clock className="h-5 w-5 text-gray-600" />
        <span className="text-sm text-muted-foreground">Pending Review</span>
      </div>
      <span className="text-2xl font-bold text-gray-600">
        {applications.filter(a => a.status === 'pending').length}
      </span>
    </div>

    {/* Processing */}
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
      <div className="flex items-center space-x-2">
        <Clock className="h-5 w-5 text-yellow-600" />
        <span className="text-sm text-muted-foreground">Under Processing</span>
      </div>
      <span className="text-2xl font-bold text-yellow-600">
        {applications.filter(a => a.status === 'processing').length}
      </span>
    </div>

    {/* ✅ APPROVED BY Department (All-Time) */}
    <div className="flex items-center justify-between p-3 bg-green-50 border-2 border-green-200 rounded-lg">
      <div className="flex flex-col">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-sm font-semibold text-green-900">Approved by {DEPARTMENT_NAME}</span>
        </div>
        <span className="text-xs text-green-600 ml-7 mt-0.5">
          Total approved (all-time)
        </span>
      </div>
      <span className="text-2xl font-bold text-green-600">
        {departmentStats.totalApproved}
      </span>
    </div>

    {/* Transferred Out */}
    <div className="flex items-center justify-between p-3 bg-purple-50 border-2 border-purple-200 rounded-lg">
      <div className="flex flex-col">
        <div className="flex items-center space-x-2">
          <Send className="h-5 w-5 text-purple-600" />
          <span className="text-sm font-semibold text-purple-900">Transferred Out</span>
        </div>
        <span className="text-xs text-purple-600 ml-7 mt-0.5">
          Moved to other departments
        </span>
      </div>
      <span className="text-2xl font-bold text-purple-600">
        {applications.filter(a => a.current_stage === 'transferred').length}
      </span>
    </div>

    {/* Rejected */}
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
      <div className="flex items-center space-x-2">
        <XCircle className="h-5 w-5 text-red-600" />
        <span className="text-sm text-muted-foreground">Rejected</span>
      </div>
      <span className="text-2xl font-bold text-red-600">
        {applications.filter(a => a.status === 'rejected').length}
      </span>
    </div>
  </div>
</CardContent>

              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />

      {selectedApplication && (
        <ApplicationDetailsDialog
          application={selectedApplication}
          open={dialogOpen}
           onOpenChange={(open) => {
      setDialogOpen(open);
      if (!open) {
        // ✅ ADD THESE TWO LINES:
        setSelectedApplication(null);
        fetchApplications();
      }
    }}
          onApprove={(remarks) => handleApproveApplication(selectedApplication.id, remarks)}
          onReject={(remarks) => handleRejectApplication(selectedApplication.id, remarks)}
          onSetProcessing={(remarks) => handleSetProcessing(selectedApplication.id, remarks)}
          onTransfer={(remarks) => handleTransferToSuperAdmin(selectedApplication.id, remarks)}  // ✅ ADD THIS LINE
          onViewDocument={handleViewDocument}
          processing={processingAction}
          departmentName={DEPARTMENT_NAME}
        />
      )}
       {/* PDF Viewer Dialog */}
    <PDFViewerDialog
      open={pdfViewerOpen}
      onClose={handleClosePdfViewer}
      pdfUrl={pdfUrl}
      documentName={currentDocName}
    />
    </div>
  );
}
