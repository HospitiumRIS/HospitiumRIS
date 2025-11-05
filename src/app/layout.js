import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeContextProvider } from '../components/ThemeProvider';
import NavigationProgressBar from '../components/NavigationProgressBar';
import AuthProvider from '../components/AuthProvider';
import AppNavbar from '../components/AppNavbar';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Hospitium Ris - Hospitality Management Solutions",
  description: "Revolutionary hospitality management platform designed for modern businesses. Streamline operations, enhance guest experiences, and drive growth.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="emotion-insertion-point" content="" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeContextProvider>
          <AuthProvider>
            <NavigationProgressBar />
            <AppNavbar />
            {children}
          </AuthProvider>
        </ThemeContextProvider>
      </body>
    </html>
  );
}
