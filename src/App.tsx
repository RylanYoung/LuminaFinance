import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './hooks/useToast'
import { getSession } from './auth/session'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Budgets from './pages/Budgets'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Categories from './pages/Categories'

function InvestmentsPlaceholder() {
  return (
    <div className="p-container-padding max-w-4xl mx-auto pt-10">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-12 shadow-ambient text-center">
        <span className="material-symbols-outlined text-outline text-[48px] mb-4 block">account_balance_wallet</span>
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Investments</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">Coming soon — portfolio tracking and investment insights.</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/investments" element={<InvestmentsPlaceholder />} />
          </Route>
          <Route path="*" element={<Navigate to={getSession() ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
