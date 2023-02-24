import { SideNav } from "../sidenav";
import clsx from "clsx";
import { DetailedHTMLProps, HTMLAttributes } from "react";

export function Layout({
  children,
  ...props
}: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {
  return (
    <div {...props} className={clsx("lg:flex", props.className)}>
      {children}
    </div>
  );
}

export function AppLayout({ children }: { children: any }) {
  return (
    <Layout>
      <SideNav />
      <main className="flex-1 h-full">{children}</main>
    </Layout>
  );
}
