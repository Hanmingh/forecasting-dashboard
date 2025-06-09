import { SidebarProvider, SidebarTrigger } from './ui/sidebar'
import { AppSidebar } from "@/components/ui/app-sidebar"
import { Outlet } from 'react-router-dom'

const Layout = () => {
  return (
    <div className='min-h-screen'>
        <SidebarProvider>
          <AppSidebar />
          <main className='min-h-screen container mx-auto px-4 py-8'>
            <SidebarTrigger className="mb-4 text-[#4670bc] hover:bg-[#61adde]/10 border-[#99b6c4]" />
            <Outlet />
          </main>
        </SidebarProvider>
    </div>
  )
}

export default Layout