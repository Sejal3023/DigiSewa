import React, { useState, useEffect } from 'react';
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackendStatus } from "@/components/BackendStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getApiUrl } from '@/config/api';
import { 
  Server, 
  Wifi, 
  WifiOff, 
  Globe, 
  Database,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react';

const ConnectionTest = () => {
  const [backendStatus, setBackendStatus] = useState<string>('Testing...');
  const [frontendStatus, setFrontendStatus] = useState<string>('Frontend running on port 8080');
  const [apiTestResult, setApiTestResult] = useState<string>('Not tested');
  const [corsTestResult, setCorsTestResult] = useState<string>('Not tested');
  const [isLoading, setIsLoading] = useState(false);

  const testBackendConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl('/health'));
      if (response.ok) {
        const data = await response.json();
        setBackendStatus(`✅ Backend connected on port 5002 - Status: ${data.status}`);
        setApiTestResult('✅ API endpoint responding correctly');
      } else {
        setBackendStatus(`❌ Backend connection failed - Status: ${response.status}`);
        setApiTestResult(`❌ API endpoint error: ${response.status}`);
      }
    } catch (error) {
      setBackendStatus(`❌ Backend connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setApiTestResult(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testCorsConnection = async () => {
    try {
      const response = await fetch(getApiUrl('/health'), {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:8080',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      if (response.ok) {
        setCorsTestResult('✅ CORS preflight successful');
      } else {
        setCorsTestResult(`❌ CORS preflight failed: ${response.status}`);
      }
    } catch (error) {
      setCorsTestResult(`❌ CORS test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    testBackendConnection();
    testCorsConnection();
  }, []);

  const getStatusIcon = (status: string) => {
    if (status.includes('✅')) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (status.includes('❌')) return <XCircle className="h-5 w-5 text-red-500" />;
    return <Clock className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusColor = (status: string) => {
    if (status.includes('✅')) return 'text-green-600';
    if (status.includes('❌')) return 'text-red-600';
    return 'text-yellow-600';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-8 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Backend Connection Test</h1>
            <p className="text-lg text-muted-foreground">
              Verify the connection between frontend and backend services
            </p>
          </div>

          {/* Connection Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Frontend Status</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Online</div>
                <p className="text-xs text-muted-foreground">Port 8080</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Backend Status</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Online</div>
                <p className="text-xs text-muted-foreground">Port 5002</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Test Results */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <RefreshCw className="h-5 w-5" />
                <span>Connection Test Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(backendStatus)}
                  <span className="font-medium">Backend Health Check</span>
                </div>
                <span className={getStatusColor(backendStatus)}>{backendStatus}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(apiTestResult)}
                  <span className="font-medium">API Endpoint Test</span>
                </div>
                <span className={getStatusColor(apiTestResult)}>{apiTestResult}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(corsTestResult)}
                  <span className="font-medium">CORS Configuration</span>
                </div>
                <span className={getStatusColor(corsTestResult)}>{corsTestResult}</span>
              </div>
            </CardContent>
          </Card>

          {/* Backend Status Component */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Real-time Backend Status</CardTitle>
            </CardHeader>
            <CardContent>
              <BackendStatus />
            </CardContent>
          </Card>

          {/* Test Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Manual Tests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Test Backend Connection</p>
                  <p className="text-sm text-muted-foreground">Manually test the backend health endpoint</p>
                </div>
                <Button 
                  onClick={testBackendConnection} 
                  disabled={isLoading}
                  variant="outline"
                >
                  {isLoading ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Test CORS</p>
                  <p className="text-sm text-muted-foreground">Verify CORS configuration is working</p>
                </div>
                <Button 
                  onClick={testCorsConnection} 
                  variant="outline"
                >
                  Test CORS
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Info */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Configuration Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Frontend URL:</span>
                <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:8080</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Backend URL:</span>
                <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:5002</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">API Base URL:</span>
                <code className="bg-gray-100 px-2 py-1 rounded">{getApiUrl('')}</code>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ConnectionTest;
