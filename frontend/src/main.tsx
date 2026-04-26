
   import { QueryClientProvider } from "@tanstack/react-query";
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { queryClient } from "./app/lib/queryClient";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
  
  