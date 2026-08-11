import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { Toaster } from "react-hot-toast";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Drive Hub — Pakistan Car Rental Platform",
  description: "Multi-tenant car rental platform for Pakistan. Find & book vehicles from verified agencies in Karachi, Lahore and Islamabad with guaranteed availability and tenant data isolation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${plex.variable} ${mono.variable}`}>
      <body className="antialiased bg-paper text-ink-2 min-h-screen flex flex-col">
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1c1917",
                color: "#faf9f7",
                border: "1px solid #57534e",
                fontSize: "13px",
                borderRadius: "8px",
              },
            }}
          />
          <Navbar />
          <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl">
            {children}
          </main>
          <footer className="border-t border-rule mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <p className="font-display text-2xl font-semibold tracking-tight text-ink">
                    Drive Hub
                  </p>
                  <p className="label-mono mt-1.5">Pakistan car rental platform</p>
                </div>
                <p className="text-sm text-muted max-w-sm leading-relaxed">
                  Verified independent fleets in Karachi, Lahore &amp; Islamabad. Tenant-isolated data, live pricing in rupees, and real-time booking conflict detection.
                </p>
              </div>
              <div className="mt-8 pt-5 border-t border-rule flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted">
                <span>© 2026 Drive Hub</span>
                <span className="font-mono text-[11px] uppercase tracking-wider">
                  Firebase auth · Cloud firestore rules · rbac
                </span>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
