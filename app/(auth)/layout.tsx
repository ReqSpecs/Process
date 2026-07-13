import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="px-6 py-5">
        <Link href="/" aria-label="ProDraw home">
          <Wordmark className="h-5" />
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-5 pb-16 pt-10 sm:pt-16">
        {children}
      </main>
    </div>
  );
}
