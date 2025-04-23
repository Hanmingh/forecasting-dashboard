import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Layout from './components/layout';
import { ThemeProvider } from './components/ui/theme-provider';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import CommodityDashboard from './pages/commodity_dashboard';
import OilPage from './pages/oil_page';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5*60*1000, // 5 mins
      gcTime: 10*60*1000, // garbage-collection 10 mins
      retry: false,
      refetchOnWindowFocus: false,
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider defaultTheme='dark'>
          <Layout>
            <Routes>
              <Route path='/' element={<CommodityDashboard/>}/>
              <Route path='/:symbol' element={<OilPage/>}/>
            </Routes>
          </Layout>
        </ThemeProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App
