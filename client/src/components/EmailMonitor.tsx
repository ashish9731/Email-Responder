import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, AlertTriangle, CheckCircle } from "lucide-react";

interface EmailCase {
  id: string;
  caseNumber: string;
  senderEmail: string;
  subject: string;
  status: string;
  createdAt: string;
  keywords: string[];
}

interface EmailMonitorProps {
  cases: EmailCase[];
}

export default function EmailMonitor({ cases }: EmailMonitorProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'responded':
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'processing':
      case 'new':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'follow_up_sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'responded':
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'processing':
      case 'new':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Mail className="h-5 w-5 text-blue-600" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-foreground">
              <Mail className="mr-2 h-5 w-5 text-primary" />
              Email Monitoring
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Real-time email processing status</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Active
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cases.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No recent emails to display</p>
            </div>
          ) : (
            cases.map((emailCase) => (
              <div 
                key={emailCase.id} 
                className="flex items-center p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                data-testid={`email-case-${emailCase.id}`}
              >
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-4">
                  {getStatusIcon(emailCase.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">{emailCase.subject}</h4>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(emailCase.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">from: {emailCase.senderEmail}</p>
                  <div className="flex items-center mt-2 space-x-2">
                    <Badge className={`text-xs ${getStatusColor(emailCase.status)}`}>
                      {emailCase.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Case #{emailCase.caseNumber}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
