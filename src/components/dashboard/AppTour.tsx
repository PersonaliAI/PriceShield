// AppTour is intentionally a no-op — the platform tour has been replaced by
// the OnboardingModal which fires on first login. This stub prevents the
// import in layout.tsx from breaking.
export default function AppTour(_props: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return null;
}
