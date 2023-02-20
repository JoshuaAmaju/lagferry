import { get_sessionConfig } from "@/common/utils/session";
import { withIronSessionSsr } from "iron-session/next";

export const getServerSideProps = withIronSessionSsr(function ({ req }) {
  req?.session.destroy();
  return { redirect: { destination: "/auth/login" } } as any;
}, get_sessionConfig());

export default function Logout() {
  return <p>Redirecting...</p>;
}
