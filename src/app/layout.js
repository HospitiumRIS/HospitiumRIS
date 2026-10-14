import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ThemeContextProvider } from '../components/ThemeProvider';
import NavigationProgressBar from '../components/NavigationProgressBar';
import AuthProvider from '../components/AuthProvider';
import AppNavbar from '../components/AppNavbar';
import I18nProvider from '../components/I18nProvider';

// Fonts are bundled locally via the `geist` package so the production build
// never needs to reach fonts.googleapis.com (which failed on the VPS).
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
      <body className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <I18nProvider>
          <ThemeContextProvider>
            <AuthProvider>
              <NavigationProgressBar />
              <AppNavbar />
              {children}
            </AuthProvider>
          </ThemeContextProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
