export default function OAuthLayout({ children }: { children: React.ReactNode }) {
  // A nested App Router layout must NOT render <html>/<body> (only the root
  // layout may). Rendering them here breaks static generation of the error
  // pages under Next 15 ("<Html> should not be imported outside pages/_document").
  return <>{children}</>;
}
