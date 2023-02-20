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
import { Button } from "@chakra-ui/react";

type Props = { data: Array<Vessel> } | { error: string };

export const getServerSideProps = withIronSessionSsr(({ req, res }) => {
  const { auth } = req.session as any;

  const env = get_env();

  //   const http = with_tokenRefresh(get_http(env))(auth)((newAuth) => {
  //     console.log(newAuth);
  //   });

  const http = get_http_with_token_refresh(() => get_http(env))(auth)(
    (newAuth) => {
      console.log("refresh", newAuth);
    }
  );

  const run = pipe(TE.fromEither(http), TE.chain(get_vessels));

  return run().then(
    E.matchW(
      (err) => {
        console.log("error", err);

        return err instanceof Error
          ? { props: { error: err.message } }
          : err?.status === 401
          ? {
              redirect: {
                destination: `/auth/login?continue_to=${req.url}`,
              },
            }
          : { props: { error: err?.data } };
      },
      (result) => {
        // console.log("result", result);
        return {
          props: { data: result },
        } as any;
      }
    )
  );
}, get_sessionConfig());

export default function Vessels(props: Props) {
  return (
    <Layout>
      <SideNav active="vessels" />

      <div className="flex-1">
        <header className="page-header">
          <h1 className="page-title">Vessels</h1>
        </header>

        <main className="p-6 space-y-6">
          <div className="flex justify-end">
            <Button as={Link} href="/vessels/new" colorScheme="blue">
              Add Vessel
            </Button>
          </div>

          <div>
            {"data" in props ? (
              <ul className="flex gap-8 flex-wrap grid grid-cols-3">
                {pipe(
                  props.data,
                  A.map((vessel) => (
                    <li key={vessel.vesselId} className="flex-1">
                      <Link
                        href={`/vessels/${vessel.vesselId}`}
                        className="flex space-x-4 bg-white p-4 rounded-md"
                      >
                        <div className="w-[5rem] h-[3rem] bg-gray-200" />

                        <div>
                          <h3 className="text-lg font-bold">{vessel.name}</h3>
                          <h6>{vessel.referenceNumber}</h6>
                        </div>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            ) : (
              <p></p>
            )}
          </div>
        </main>
      </div>
    </Layout>
  );
}
