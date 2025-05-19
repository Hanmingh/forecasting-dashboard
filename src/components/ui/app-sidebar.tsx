import { History, Home, Lightbulb, Inbox, TrendingUpDown, Settings } from "lucide-react"
import Header from '@/components/header'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter
} from "@/components/ui/sidebar"
import { NavUser } from "./nav-user"
import { useQuery } from '@tanstack/react-query'
import api from '@/api'
import { Link } from "react-router-dom"

// Menu items.
const forecasting_items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Forecast",
    url: "/forecast",
    icon: TrendingUpDown,
  },
  {
    title: "History",
    url: "/history",
    icon: History,
  },
]

const general_items = [
  {
    title: "Insights",
    url: "/insights",
    icon: Lightbulb,
  },
  {
    title: "Inbox",
    url: "/inbox",
    icon: Inbox,
  },
  {
    title: "Settings",
    url: "/setting",
    icon: Settings,
  },
]

export function AppSidebar() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const res = await api.get('/')  
      return res.data.User as { email: string; first_name: string }
    },
    staleTime: 5 * 60_000,
  })

  if (isLoading) {
    return <Sidebar><SidebarContent>Loading user…</SidebarContent></Sidebar>
  }
  if (isError || !data) {
    return <Sidebar><SidebarContent>Unknown user infomation</SidebarContent></Sidebar>
  }

  const user = {
    name: data.first_name,
    email: data.email,
    avatar: `/api/users/avatar.png`
  }

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <Header />
          <SidebarGroupLabel>Data</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {forecasting_items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {general_items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
