import { HashRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Layout from './components/layout';
import { ThemeProvider } from './components/ui/theme-provider';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import Homepage from './pages/homepage';
import OilPage from './pages/oil_page';
import ForecastPage from './pages/forecast_page';
import HistoryPage from './pages/history_page';
import InboxPage from './pages/Inbox_page';
import SettingPage from './pages/setting_page';

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
      {/* Can change back to BrowserRouter if not deployed on Github */}
      <HashRouter>
        <ThemeProvider defaultTheme='light'>
          <Layout>
            <Routes>
              <Route path='/' element={<Homepage/>}/>
              <Route path='/:symbol' element={<OilPage/>}/>
              <Route path="/forecast_page" element={<ForecastPage/>} />
              <Route path="/history_page" element={<HistoryPage/>} />
              <Route path="/Inbox_page" element={<InboxPage/>} />
              <Route path="/setting_page" element={<SettingPage/>} />
            </Routes>
          </Layout>
        </ThemeProvider>
      </HashRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App
