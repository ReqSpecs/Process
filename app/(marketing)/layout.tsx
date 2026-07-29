import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { AuthModalProvider } from "@/components/auth/AuthModal";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthModalProvider>
      <div className="flex min-h-screen flex-col bg-paper">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </AuthModalProvider>
  );
}
