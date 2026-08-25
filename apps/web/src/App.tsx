import { Route, Routes, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { BottomNav } from "./components/BottomNav";
import { HomeLockProvider } from "./lib/homeLock";
import { ProtectedRoute, RequireAdmin } from "./components/guards";
import { ToastHost } from "./components/Toast";
import { ConfirmProvider } from "./components/Confirm";

const Home = lazy(() => import("./pages/Home").then((m) => ({ default: m.Home })));
const Catalog = lazy(() => import("./pages/Catalog").then((m) => ({ default: m.Catalog })));
const VideoDetail = lazy(() => import("./pages/VideoDetail").then((m) => ({ default: m.VideoDetail })));
const Specialties = lazy(() => import("./pages/Specialties").then((m) => ({ default: m.Specialties })));
const CaseStudyDetail = lazy(() => import("./pages/CaseStudyDetail").then((m) => ({ default: m.CaseStudyDetail })));
const Plans = lazy(() => import("./pages/Plans").then((m) => ({ default: m.Plans })));
const Shop = lazy(() => import("./pages/Shop").then((m) => ({ default: m.Shop })));
const ProductDetail = lazy(() => import("./pages/ProductDetail").then((m) => ({ default: m.ProductDetail })));
const Cart = lazy(() => import("./pages/Cart").then((m) => ({ default: m.Cart })));
const StoreCheckout = lazy(() => import("./pages/StoreCheckout").then((m) => ({ default: m.StoreCheckout })));
const Checkout = lazy(() => import("./pages/Checkout").then((m) => ({ default: m.Checkout })));
const PixPayment = lazy(() => import("./pages/PixPayment").then((m) => ({ default: m.PixPayment })));
const Login = lazy(() => import("./pages/Login").then((m) => ({ default: m.Login })));
const Register = lazy(() => import("./pages/Register").then((m) => ({ default: m.Register })));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword").then((m) => ({ default: m.ForgotPassword })));
const Dashboard = lazy(() => import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const Commissions = lazy(() => import("./pages/Commissions").then((m) => ({ default: m.Commissions })));
const Favorites = lazy(() => import("./pages/Favorites").then((m) => ({ default: m.Favorites })));
const Legal = lazy(() => import("./pages/Legal").then((m) => ({ default: m.Legal })));
const Profile = lazy(() => import("./pages/Profile").then((m) => ({ default: m.Profile })));
const Financeiro = lazy(() => import("./pages/Financeiro").then((m) => ({ default: m.Financeiro })));
const MeusEstudos = lazy(() => import("./pages/MeusEstudos").then((m) => ({ default: m.MeusEstudos })));
const MyContent = lazy(() => import("./pages/my/MyContent").then((m) => ({ default: m.MyContent })));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout").then((m) => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard").then((m) => ({ default: m.AdminDashboard })));
const AdminHome = lazy(() => import("./pages/admin/AdminHome").then((m) => ({ default: m.AdminHome })));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers").then((m) => ({ default: m.AdminUsers })));
const AdminVideos = lazy(() => import("./pages/admin/AdminVideos").then((m) => ({ default: m.AdminVideos })));
const AdminSpecialties = lazy(() => import("./pages/admin/AdminSpecialties").then((m) => ({ default: m.AdminSpecialties })));
const AdminTags = lazy(() => import("./pages/admin/AdminTags").then((m) => ({ default: m.AdminTags })));
const AdminCaseStudies = lazy(() => import("./pages/admin/AdminCaseStudies").then((m) => ({ default: m.AdminCaseStudies })));
const AdminPlans = lazy(() => import("./pages/admin/AdminPlans").then((m) => ({ default: m.AdminPlans })));
const AdminAffiliates = lazy(() => import("./pages/admin/AdminAffiliates").then((m) => ({ default: m.AdminAffiliates })));
const AdminShop = lazy(() => import("./pages/admin/AdminShop").then((m) => ({ default: m.AdminShop })));
const AdminFinanceiro = lazy(() => import("./pages/admin/AdminFinanceiro").then((m) => ({ default: m.AdminFinanceiro })));
const AdminEstudos = lazy(() => import("./pages/admin/AdminEstudos").then((m) => ({ default: m.AdminEstudos })));

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-24 text-muted-foreground" role="status" aria-live="polite">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

export default function App() {
  const location = useLocation();
  return (
    <HomeLockProvider>
      <div className="flex min-h-screen flex-col overflow-x-clip">
        <Navbar />
      <main className="flex-1 pb-20 lg:pb-0">
        <div key={location.pathname} className="animate-page-enter">
        <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/video/:slug" element={<VideoDetail />} />
          <Route path="/especialidades" element={<Specialties />} />
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
            path="/pagamento-pix"
            element={
              <ProtectedRoute>
                <PixPayment />
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
            path="/financeiro"
            element={
              <ProtectedRoute>
                <Financeiro />
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
            path="/meus-estudos"
            element={
              <ProtectedRoute>
                <MeusEstudos />
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
            <Route path="home" element={<AdminHome />} />
            <Route path="usuarios" element={<AdminUsers />} />
            <Route path="videos" element={<AdminVideos />} />
            <Route path="especialidades" element={<AdminSpecialties />} />
            <Route path="tags" element={<AdminTags />} />
            <Route path="casos" element={<AdminCaseStudies />} />
            <Route path="planos" element={<AdminPlans />} />
            <Route path="loja" element={<AdminShop />} />
            <Route path="afiliados" element={<AdminAffiliates />} />
            <Route path="financeiro" element={<AdminFinanceiro />} />
            <Route path="estudos" element={<AdminEstudos />} />
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
        </Suspense>
        </div>
      </main>
<Footer />
        <BottomNav />
        <ToastHost />
        <ConfirmProvider />
      </div>
    </HomeLockProvider>
  );
}
