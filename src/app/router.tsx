/* eslint-disable react-refresh/only-export-components -- route table, not a component module */
import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { PageSkeleton } from '@/components/ui'
import { AppLayout } from './AppLayout'
import { RouteError } from './RouteError'

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Inbox = lazy(() => import('@/pages/Inbox'))
const TeamDay = lazy(() => import('@/pages/TeamDay'))
const Leads = lazy(() => import('@/pages/Leads'))
const LeadDetail = lazy(() => import('@/pages/LeadDetail'))
const Pipeline = lazy(() => import('@/pages/Pipeline'))
const FollowUps = lazy(() => import('@/pages/FollowUps'))
const Customers = lazy(() => import('@/pages/Customers'))
const Products = lazy(() => import('@/pages/Products'))
const Reports = lazy(() => import('@/pages/Reports'))
const AIAssistant = lazy(() => import('@/pages/AIAssistant'))
const Settings = lazy(() => import('@/pages/Settings'))
const Login = lazy(() => import('@/pages/Login'))
const NotFound = lazy(() => import('@/pages/NotFound'))

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <Login />
      </Suspense>
    ),
    errorElement: <RouteError />,
  },
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'inbox', element: <Inbox /> },
      { path: 'team-day', element: <TeamDay /> },
      { path: 'leads', element: <Leads /> },
      { path: 'leads/:id', element: <LeadDetail /> },
      { path: 'pipeline', element: <Pipeline /> },
      { path: 'follow-ups', element: <FollowUps /> },
      { path: 'customers', element: <Customers /> },
      { path: 'products', element: <Products /> },
      { path: 'reports', element: <Reports /> },
      { path: 'ai-assistant', element: <AIAssistant /> },
      { path: 'settings', element: <Settings /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
