import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Configuration from "@/pages/configuration";
import EmailMonitorPage from "@/pages/email-monitor";
import CaseManagement from "@/pages/case-management";
import OneDriveFiles from "@/pages/onedrive-files";
import Analytics from "@/pages/analytics";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/configuration" component={Configuration} />
      <Route path="/email-monitor" component={EmailMonitorPage} />
      <Route path="/case-management" component={CaseManagement} />
      <Route path="/onedrive-files" component={OneDriveFiles} />
      <Route path="/analytics" component={Analytics} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
