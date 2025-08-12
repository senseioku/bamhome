import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/Navigation";
import Home from "@/pages/home";
import SwapPage from "@/pages/swap";
import AiChat from "@/pages/AiChat";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/swap" component={SwapPage} />
      <Route path="/ai-chat" component={AiChat} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <div className="dark">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
            <Navigation />
            <main className="relative">
              <Toaster />
              <Router />
            </main>
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
