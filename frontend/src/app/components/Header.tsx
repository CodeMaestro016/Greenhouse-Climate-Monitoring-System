import { RefreshCw, Search } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface HeaderProps {
  lastUpdated: string;
  onRefresh: () => void;
}

export function Header({ lastUpdated, onRefresh }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Greenhouse Climate Monitoring System
          </h1>
          <p className="text-sm text-gray-600">Mochiforge (PVT) LTD</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Last updated: {lastUpdated}
          </span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onRefresh}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              type="text" 
              placeholder="Search..." 
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
