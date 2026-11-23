// Certificate verification pages show a person's name: keep them out of search engines (#101).
export const metadata = {
  title: 'Verify a certificate | HospitiumRIS',
  robots: { index: false, follow: false },
};

export default function VerifyLayout({ children }) {
  return children;
}
