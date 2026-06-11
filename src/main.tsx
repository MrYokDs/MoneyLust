import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import App from './App';
import { store } from './store';
import './index.css';

// Create React Query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider 
          maxSnack={3} 
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          style={{ fontFamily: 'Prompt, sans-serif' }}
        >
          <App />
        </SnackbarProvider>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);
