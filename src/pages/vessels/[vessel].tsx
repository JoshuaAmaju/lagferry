import { get_sessionConfig } from "@/common/utils/session";
import { withIronSessionSsr } from "iron-session/next";

import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";

import { Layout } from "@/common/components/layout";
import { SideNav } from "@/common/components/sidenav";
import { get_env } from "@/core/common/env";
import { get_http, get_http_with_token_refresh } from "@/core/common/http";
import type { Vessel } from "@/core/models/vessel";
import { get_vessel } from "@/core/usecases/vessel";
import { Avatar, Button } from "@chakra-ui/react";
import createHttpError from "http-errors";
import { inspect } from "util";

type Props = { data: E.Either<string, Vessel> };

export const getServerSideProps = withIronSessionSsr(({ req, res, query }) => {
  const { auth } = req.session as any;

  const env = get_env();

  const http = get_http_with_token_refresh(() => get_http(env))(auth)(
    (newAuth) => {
      console.log("newAuth", newAuth);
    }
  );

  const run = pipe(
    TE.Do,
    TE.fromEitherK(() => {
      const { vessel } = query;
      return typeof vessel !== "string"
        ? E.left(createHttpError.BadRequest())
        : E.right(parseInt(vessel));
    }),
    TE.chain((id) => {
      return pipe(
        TE.fromEither(http),
        TE.chain((http) => get_vessel(http)(id))
      );
    })
  );

  return run().then(
    E.matchW(
      (err) => {
        console.log("error", err);

        return err instanceof Error
          ? { props: { error: E.left(err.message) } }
          : err?.status === 401
          ? { redirect: { destination: `/auth/login?continue_to=${req.url}` } }
          : { props: { error: E.left("An error occurred") } };
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

export default function Vessel({ data }: Props) {
  console.log(data);

  return (
    <Layout>
      <SideNav active="vessels" />

      <div className="flex-1">
        <header className="page-header">
          <h1 className="page-title">Vessel</h1>
        </header>

        <main className="p-6">
          {pipe(
            data,
            E.match(
              () => <></>,
              (vessel) => {
                return (
                  <div className="space-y-10">
                    {/* hero */}
                    <div className="space-y-4">
                      <div className="h-[20rem] bg-gray-300" />

                      <div className="flex justify-between">
                        <div className="space-y-2">
                          <div className="space-x-4">
                            <span className="align-middle text-2xl font-bold">
                              {vessel.name}
                            </span>
                            <span className="align-middle">
                              <Button size="sm">Edit</Button>
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <p>{vessel.referenceNumber}</p>
                            <p>{vessel.speed}</p>
                          </div>

                          <p>{vessel.tonnage}kg</p>
                        </div>

                        <Button size="sm">More Details</Button>
                      </div>
                    </div>
                    {/* hero */}

                    <div className="lg:flex gap-6">
                      <div className="flex-1 space-y-12">
                        {/* cameras */}
                        <div className="space-y-3">
                          <div>
                            <h3 className="text-lg font-semibold">Cameras</h3>
                          </div>

                          <ul className="flex gap-6 flex-wrap grid grid-cols-2">
                            {pipe(
                              [
                                ...vessel.cameras,
                                ...vessel.cameras,
                                ...vessel.cameras,
                              ],
                              A.map((camera) => (
                                <li
                                  key={camera.cameraId}
                                  className="flex-[0_1_40%] bg-white rounded-md overflow-hidden"
                                >
                                  <div className="bg-gray-400 h-[10rem]" />
                                  <div className="p-4 flex justify-between items-center gap-2">
                                    <div>
                                      <p>{camera.serialNumber}</p>
                                    </div>

                                    <div className="space-x-2">
                                      <Button size="xs">Remove</Button>
                                      <Button size="xs">Re-assign</Button>
                                    </div>
                                  </div>
                                </li>
                              ))
                            )}
                          </ul>
                        </div>
                        {/* cameras */}

                        {/* crew members */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            <h3 className="text-lg font-semibold">
                              Crew Members
                            </h3>

                            <Button size="sm" colorScheme="facebook">
                              Assign More
                            </Button>
                          </div>

                          <ul className="flex gap-6 flex-wrap grid grid-cols-3">
                            {pipe(
                              [
                                ...vessel.crewMembers,
                                ...vessel.crewMembers,
                                ...vessel.crewMembers,
                                ...vessel.crewMembers,
                                ...vessel.crewMembers,
                              ],
                              A.map((crew) => {
                                const name = `${crew.lastName} ${crew.firstName}`;

                                return (
                                  <li
                                    key={crew.crewMemberId}
                                    className="bg-white rounded-md p-4 flex items-center justify-between gap-2"
                                  >
                                    <div className="flex gap-4 items-center">
                                      <Avatar name={name} />

                                      <div>
                                        <p className="text-lg font-medium">
                                          {name}
                                        </p>
                                        <p className="text-xs">{crew.type}</p>
                                      </div>
                                    </div>

                                    <Button size="xs">Remove</Button>
                                  </li>
                                );
                              })
                            )}
                          </ul>
                        </div>
                        {/* crew members */}
                      </div>

                      <div className="lg:w-[15rem] space-y-3">
                        {/* tracker */}
                        <div>
                          <h3 className="text-lg font-semibold">Tracker</h3>
                        </div>

                        <div className="p-4 bg-white rounded-md space-y-4">
                          <p className="text-lg font-medium">
                            {vessel.tracker.serialNumber}
                          </p>

                          <div className="space-x-2">
                            <Button size="xs">Remove</Button>
                            <Button size="xs">Re-assign</Button>
                          </div>
                        </div>
                        {/* tracker */}
                      </div>
                    </div>
                  </div>
                );
              }
            )
          )}
        </main>
      </div>
    </Layout>
  );
}
