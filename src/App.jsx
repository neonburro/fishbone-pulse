import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import RequestAccount from './pages/Auth/RequestAccount'
import ResetPassword from './pages/Auth/ResetPassword'
import AcceptInvite from './pages/Auth/AcceptInvite'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import OrderDetail from './pages/Orders/OrderDetail'
import JobTicket from './pages/Orders/JobTicket'
import Quotes from './pages/Quotes'
import Customers from './pages/Customers'
import Products from './pages/Products'
import ProductForm from './pages/Products/ProductForm'
import Categories from './pages/Categories'
import Showcase from './pages/Showcase'
import Notes from './pages/Notes'
import NoteEditor from './pages/Notes/NoteEditor'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/request-account" element={<RequestAccount />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/accept-invite" element={<AcceptInvite />} />

      {/* Print view: protected, but without the app chrome */}
      <Route
        path="/orders/:id/ticket"
        element={
          <ProtectedRoute>
            <JobTicket />
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/quotes" element={<Quotes />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/new" element={<ProductForm />} />
        <Route path="/products/:id" element={<ProductForm />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/showcase" element={<Showcase />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/notes/new" element={<NoteEditor />} />
        <Route path="/notes/:id" element={<NoteEditor />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
