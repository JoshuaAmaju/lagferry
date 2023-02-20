import { get_sessionConfig } from "@/common/utils/session";
import { withIronSessionSsr } from "iron-session/next";

import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as B from "fp-ts/boolean";
import { pipe } from "fp-ts/lib/function";

import { get_http } from "@/core/common/http";
import { get_http_with_token_refresh } from "@/core/common/http";
import { get_env } from "@/core/common/env";
import { get_vessels } from "@/core/usecases/vessel";
import { Vessel } from "@/core/models/vessel";
import Link from "next/link";
import { SideNav } from "@/common/components/sidenav";
import { AppLayout, Layout } from "@/common/components/layout";

import createHttpError from "http-errors";
import { get_terminals } from "@/core/usecases/terminal";
import { inspect } from "util";
import { Button } from "@chakra-ui/react";
import type { Terminal } from "@/core/models/terminal";

type Props = { data: E.Either<string, Array<Terminal>> };

export const getServerSideProps = withIronSessionSsr(({ req }) => {
  const { auth } = req.session as any;

  const env = get_env();

  const http = get_http_with_token_refresh(() => get_http(env))(auth)(
    (newAuth) => {
      console.log("refresh", newAuth);
    }
  );

  const run = pipe(TE.fromEither(http), TE.chain(get_terminals));

  return run().then(
    E.matchW(
      (err) => {
        console.log("error", err);

        return err instanceof Error
          ? { props: { error: E.left(err.message) } }
          : err?.status === 401
          ? {
              redirect: {
                destination: `/auth/login?continue_to=${req.url}`,
              },
            }
          : { props: { error: E.left(err?.data) } };
      },
      (result) => {
        console.log("result", inspect(result, false, Infinity));
        return {
          props: { data: E.right(result) },
        } as any;
      }
    )
  );
}, get_sessionConfig());

export default function Terminals(props: Props) {
  return (
    <Layout>
      <SideNav active="terminals" />

      <div className="flex-1">
        <header className="page-header">
          <h1 className="page-title">Terminals</h1>
        </header>

        <main className="p-6 space-y-6">
          <div className="flex justify-end">
            <Button colorScheme="blue">Add Terminal</Button>
          </div>

          {pipe(
            props.data,
            E.match(
              () => <></>,
              (terminals) => {
                return (
                  <ul className="lg:flex gap-8 flex-wrap lg:grid grid-cols-3">
                    {pipe(
                      terminals,
                      A.map((terminal) => (
                        <li key={terminal.terminalId} className="flex-1">
                          <Link
                            href={`/terminals/${terminal.terminalId}`}
                            className="lg:flex lg:space-x-4 bg-white p-4 rounded-md block"
                          >
                            <div className="lg:w-[7rem] lg:flex-[0_0_7rem] h-[5rem] bg-gray-200" />

                            <div className="flex-1 max-w-[60%]">
                              <p className="text-lg font-bold w-4/5 truncate">
                                {terminal.name}
                              </p>
                            </div>
                          </Link>
                        </li>
                      ))
                    )}
                  </ul>
                );
              }
            )
          )}
        </main>
      </div>
    </Layout>
  );
}
