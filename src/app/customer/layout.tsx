export const dynamic = "force-dynamic";

import CustomerShell from "./CustomerShell";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <CustomerShell>{children}</CustomerShell>;
}
