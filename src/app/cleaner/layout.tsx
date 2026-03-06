export const dynamic = "force-dynamic";

import CleanerShell from "./CleanerShell";

export default function CleanerLayout({ children }: { children: React.ReactNode }) {
  return <CleanerShell>{children}</CleanerShell>;
}
