import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import Navbar from "@/components/Navbar";
import { EmployeeProvider } from "../context/EmployeeContext";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "react-hot-toast";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Impul klinika platformasi",
  description: "",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <EmployeeProvider>
            <Toaster position="top-center" />
            <Navbar />
            <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-20">
              {children}
            </main>
          </EmployeeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
