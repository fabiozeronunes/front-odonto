import { Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ProtectedRoute, RequireAdmin } from "./components/guards";
import { Home } from "./pages/Home";
import { Catalog } from "./pages/Catalog";
import { VideoDetail } from "./pages/VideoDetail";
import { Specialties } from "./pages/Specialties";
import { CaseStudies } from "./pages/CaseStudies";
import { CaseStudyDetail } from "./pages/CaseStudyDetail";
import { Plans } from "./pages/Plans";
import { Shop } from "./pages/Shop";
import { ProductDetail } from "./pages/ProductDetail";
import { Cart } from "./pages/Cart";
import { StoreCheckout } from "./pages/StoreCheckout";
import { Checkout } from "./pages/Checkout";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Dashboard } from "./pages/Dashboard";
import { Commissions } from "./pages/Commissions";
import { Favorites } from "./pages/Favorites";
import { Legal } from "./pages/Legal";
import { Profile } from "./pages/Profile";
import { MyContent } from "./pages/my/MyContent";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminVideos } from "./pages/admin/AdminVideos";
import { AdminSpecialties } from "./pages/admin/AdminSpecialties";
import { AdminTags } from "./pages/admin/AdminTags";
import { AdminCaseStudies } from "./pages/admin/AdminCaseStudies";
import { AdminPlans } from "./pages/admin/AdminPlans";
import { AdminAffiliates } from "./pages/admin/AdminAffiliates";
import { AdminShop } from "./pages/admin/AdminShop";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/video/:slug" element={<VideoDetail />} />
          <Route path="/especialidades" element={<Specialties />} />
          <Route path="/casos" element={<CaseStudies />} />
          <Route path="/casos/:slug" element={<CaseStudyDetail />} />
          <Route path="/planos" element={<Plans />} />
          <Route path="/loja" element={<Shop />} />
          <Route path="/loja/:slug" element={<ProductDetail />} />
          <Route path="/carrinho" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/recuperar-senha" element={<ForgotPassword />} />
          <Route path="/privacidade" element={<Legal type="privacidade" />} />
          <Route path="/termos" element={<Legal type="termos" />} />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout-loja"
            element={
              <ProtectedRoute>
                <StoreCheckout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favoritos"
            element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meus-conteudos"
            element={
              <ProtectedRoute>
                <MyContent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/comissoes"
            element={
              <ProtectedRoute>
                <Commissions />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="usuarios" element={<AdminUsers />} />
            <Route path="videos" element={<AdminVideos />} />
            <Route path="especialidades" element={<AdminSpecialties />} />
            <Route path="tags" element={<AdminTags />} />
            <Route path="casos" element={<AdminCaseStudies />} />
            <Route path="planos" element={<AdminPlans />} />
            <Route path="loja" element={<AdminShop />} />
            <Route path="afiliados" element={<AdminAffiliates />} />
          </Route>

          <Route
            path="*"
            element={
              <div className="mx-auto max-w-3xl px-4 py-24 text-center">
                <h1 className="text-3xl font-bold text-slate-900">Página não encontrada</h1>
                <p className="mt-2 text-slate-500">O conteúdo que você procura não existe.</p>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
