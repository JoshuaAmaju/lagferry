import { Button } from "@chakra-ui/react";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import styles from "./styles.module.css";

export function SideNav({ active = "home" }: { active?: string }) {
  return (
    <aside className="lg:h-screen lg:w-[15%] bg-[#000066] lg:sticky top-0 z-50">
      <div className="h-full bg-[url(/nav-pattern.png)] text-white">
        <div className="bg-white mx-auto rounded-b-full w-fit p-6">
          <Image
            width={80}
            height={80}
            src="/logo.png"
            alt="lagferry logo"
            className="mx-auto"
          />
        </div>

        <div className="space-y-12 py-10">
          <nav>
            <ul className="space-y-4">
              <li
                className={clsx(styles.navItem, {
                  [styles.navItem__focused]: active === "home",
                })}
              >
                <Link href="/">Home</Link>
              </li>
              <li
                className={clsx(styles.navItem, {
                  [styles.navItem__focused]: active === "dashboard",
                })}
              >
                <Link href="/dashboard">Dashboard</Link>
              </li>

              <li
                className={clsx(styles.navItem, {
                  [styles.navItem__focused]: active === "users",
                })}
              >
                <Link href="/users">Users</Link>
              </li>

              <li
                className={clsx(styles.navItem, {
                  [styles.navItem__focused]: active === "vessels",
                })}
              >
                <Link href="/vessels">Vessels</Link>
              </li>

              <li
                className={clsx(styles.navItem, {
                  [styles.navItem__focused]: active === "terminals",
                })}
              >
                <Link href="/terminals">Terminals</Link>
              </li>

              <li
                className={clsx(styles.navItem, {
                  [styles.navItem__focused]: active === "feedback",
                })}
              >
                <Link href="/feedback">Feedback</Link>
              </li>
            </ul>
          </nav>

          <div className="px-4">
            <Button
              as={Link}
              size="md"
              variant="outline"
              href="/auth/logout"
              className="block w-full"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
