import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import { ThemeProvider } from './components/ui/theme-provider';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import Homepage from './pages/homepage';
import OilPage from './pages/oil_page';
import ForecastPage from './pages/forecast_page';
import HistoryPage from './pages/history_page';
import InboxPage from './pages/Inbox_page';
import SettingPage from './pages/setting_page';
import InsightsPage from './pages/insights_page';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout';
import RoutePage from './pages/route_page';

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
        <ThemeProvider defaultTheme='light'>
          <Routes>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="/"        element={<Homepage />} />
              <Route path=":symbol"  element={<OilPage />} />
              <Route path="forecast" element={<ForecastPage />} />
              <Route path="history"  element={<HistoryPage />} />
              <Route path="route"    element={<RoutePage />} />
              <Route path="insights" element={<InsightsPage />} />
              <Route path="inbox"    element={<InboxPage />} />
              <Route path="setting"  element={<SettingPage />} />
            </Route>

            {/* 404 */}
            {/*<Route path="*" element={<NotFound />} /> */}
          </Routes>
        </ThemeProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App
