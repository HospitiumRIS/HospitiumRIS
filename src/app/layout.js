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
  title: "HospitiumRIS - Hospital Management Solutions",
  description: "HospitiumRIS (Research Information System) is an integrated digital infrastructure designed to manage, track, and enhance the entire research lifecycle in hospitals and health research institutions. It enables seamless coordination between clinicians, researchers, ethics committees, and funders through a centralized and secure platform.",
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
