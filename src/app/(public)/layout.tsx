import Navbar from "@/components/website/Navbar";
import Footer from "@/components/website/Footer";
import ScrollToTop from "@/components/website/ScrollToTop";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <ScrollToTop />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
}
