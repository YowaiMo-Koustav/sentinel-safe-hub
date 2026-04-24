import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Simple test app without database dependencies
const TestApp = () => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <BrowserRouter>
        <div style={{ padding: '20px' }}>
          <h1>Test App - If you can see this, basic React is working</h1>
          <p>Application is running without Supabase dependencies.</p>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default TestApp;
