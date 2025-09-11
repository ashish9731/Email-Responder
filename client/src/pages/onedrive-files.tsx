import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Cloud, FolderOpen, FileText, Download, RefreshCw } from "lucide-react";

export default function OneDriveFiles() {
  const { toast } = useToast();

  // Fetch system status to check OneDrive connection
  const { data: systemStatus } = useQuery({
    queryKey: ["/api/system/status"],
  }) as { data: any };

  // Setup OneDrive mutation
  const setupOneDriveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/onedrive/setup");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system/status"] });
      toast({ title: "OneDrive setup completed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to setup OneDrive", variant: "destructive" });
    },
  });

  // Fetch OneDrive files data from API
  const { data: files = [], isLoading: isLoadingFiles, refetch } = useQuery({
    queryKey: ["/api/onedrive/files"],
  }) as { data: any[], isLoading: boolean, refetch: () => void };

  const formatFileSize = (bytes: string) => bytes;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + " " + 
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'checklist':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'response':
        return <FileText className="h-4 w-4 text-green-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'checklist':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'response':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Cloud className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">OneDrive Files</h1>
                <p className="text-muted-foreground">Manage checklists and email responses stored in OneDrive</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${systemStatus?.onedriveConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-sm font-medium ${systemStatus?.onedriveConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {systemStatus?.onedriveConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Connection Status */}
          {!systemStatus?.onedriveConnected && (
            <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-800 dark:text-yellow-200">
                  <Cloud className="mr-2 h-5 w-5" />
                  OneDrive Not Connected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                  Connect your OneDrive account to automatically store checklists and email responses.
                </p>
                <Button 
                  onClick={() => setupOneDriveMutation.mutate()}
                  disabled={setupOneDriveMutation.isPending}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  <Cloud className="mr-2 h-4 w-4" />
                  {setupOneDriveMutation.isPending ? "Setting up..." : "Setup OneDrive"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Storage Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Files</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoadingFiles ? "..." : files.length}</div>
                <p className="text-xs text-muted-foreground">
                  Stored in OneDrive
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Checklists</CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoadingFiles ? "..." : files.filter(f => f.type === 'checklist').length}</div>
                <p className="text-xs text-muted-foreground">
                  Inspection checklists
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Responses</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoadingFiles ? "..." : files.filter(f => f.type === 'response').length}</div>
                <p className="text-xs text-muted-foreground">
                  Email responses
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Files List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Files</CardTitle>
                  <p className="text-sm text-muted-foreground">Checklists and responses from email cases</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingFiles ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading files...</p>
                  </div>
                ) : files.length === 0 ? (
                  <div className="text-center py-12">
                    <Cloud className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No files found</p>
                    <p className="text-sm text-muted-foreground">Files will appear here when cases are processed</p>
                  </div>
                ) : (
                  files.map((file) => (
                    <div 
                      key={file.id} 
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                      data-testid={`file-${file.id}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          {getFileIcon(file.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{file.name}</h4>
                          <div className="flex items-center mt-1 space-x-2">
                            <Badge className={`text-xs ${getFileTypeColor(file.type)}`}>
                              {file.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {file.case}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {file.size}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(file.modified)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" data-testid={`download-${file.id}`}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Folder Structure */}
          <Card>
            <CardHeader>
              <CardTitle>OneDrive Structure</CardTitle>
              <p className="text-sm text-muted-foreground">Organized file structure for your email responder</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 font-mono text-sm">
                <div className="flex items-center space-x-2">
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                  <span>Email Auto Responder/</span>
                </div>
                <div className="flex items-center space-x-2 ml-6">
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                  <span>Checklists/</span>
                  <span className="text-muted-foreground text-xs">- Engine inspection checklists</span>
                </div>
                <div className="flex items-center space-x-2 ml-6">
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                  <span>Email Responses/</span>
                  <span className="text-muted-foreground text-xs">- Saved email responses by case</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}