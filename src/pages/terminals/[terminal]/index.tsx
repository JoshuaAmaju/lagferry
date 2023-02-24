import { get_sessionConfig } from "@/common/utils/session";
import { withIronSessionSsr } from "iron-session/next";

import * as E from "fp-ts/Either";
import * as A from "fp-ts/Array";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";

import { Layout } from "@/common/components/layout";
import { SideNav } from "@/common/components/sidenav";
import { get_env } from "@/core/common/env";
import { get_http, get_http_with_token_refresh } from "@/core/common/http";
import type { Terminal } from "@/core/models/terminal";
import { get_terminal } from "@/core/usecases/terminal";
import { Avatar, Button, Link, Tag } from "@chakra-ui/react";
import createHttpError from "http-errors";
import { inspect } from "util";
import clsx from "clsx";

import styles from "@/styles/terminal.module.css";
import NextLink from "next/link";

type Props = { data: E.Either<string, Terminal> };

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
      const { terminal } = query;
      return typeof terminal !== "string"
        ? E.left(createHttpError.BadRequest())
        : E.right(parseInt(terminal));
    }),
    TE.chain((id) => {
      return pipe(
        TE.fromEither(http),
        TE.chain((http) => get_terminal(http)(id))
      );
    })
  );

  return run().then(
    E.matchW(
      (err) => {
        console.log("error", inspect(err, false, Infinity));

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

export default function Terminal({ data }: Props) {
  console.log("data", data);

  return (
    <Layout>
      <SideNav active="terminals" />

      <div className="flex-1">
        <header className="page-header">
          <h1 className="page-title">Terminal</h1>
        </header>

        <main className="p-6">
          {pipe(
            data,
            E.match(
              () => <></>,
              (terminal) => {
                return (
                  <div className="space-y-10">
                    {/* hero */}
                    <div className="space-y-4">
                      <div className="h-[15rem] bg-gray-300" />

                      <div className="space-y-2">
                        <div className="space-x-4">
                          <span className="align-middle text-2xl font-bold">
                            {terminal.name}
                          </span>
                          <span className="align-middle">
                            <Button size="sm">Edit</Button>
                          </span>
                        </div>

                        {/* <div className="flex items-center space-x-2">
                            <p>{terminal.referenceNumber}</p>
                            <p>{terminal.speed}</p>
                          </div> */}
                      </div>
                    </div>
                    {/* hero */}

                    <figure className={styles.schedules}>
                      <div className="flex items-center justify-between gap-4">
                        <figcaption>
                          <h3 className="text-lg font-semibold">Schedules</h3>
                        </figcaption>

                        <Button
                          size="md"
                          as={NextLink}
                          colorScheme="blue"
                          href={`/terminals/${terminal.terminalId}/schedules/new`}
                        >
                          Add Schedule
                        </Button>
                      </div>

                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-4 py-2 text-start">Route</th>
                            <th className="px-4 py-2 text-start">Date</th>
                            <th className="px-4 py-2 text-start">Time</th>
                            <th className="px-4 py-2 text-start">Vessel</th>
                            <th className="px-4 py-2 text-start">
                              Crew Members
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y font-medium">
                          {pipe(
                            terminal.schedules,
                            A.map((schedule) => {
                              // console.log("schedule", schedule);

                              // return null;

                              return (
                                <tr key={schedule.scheduleId}>
                                  <td className="p-4">
                                    {schedule.route?.name}
                                  </td>

                                  <td className="p-4 text-indigo-900">
                                    {schedule.scheduleDate}
                                  </td>

                                  <td className="flex gap-1 flex-wrap p-4">
                                    {pipe(
                                      schedule.scheduleTime,
                                      A.mapWithIndex((index, time) => (
                                        <Tag
                                          rounded="full"
                                          variant="subtle"
                                          colorScheme="gray"
                                          key={`${index}::${time}`}
                                        >
                                          {time}
                                        </Tag>
                                      ))
                                    )}
                                  </td>

                                  <td className="p-4">
                                    {schedule.vessel?.name}
                                  </td>

                                  {schedule.vessel ? (
                                    <td
                                      className={clsx(
                                        "flex gap-1 flex-wrap p-4",
                                        styles.crew
                                      )}
                                    >
                                      {pipe(
                                        schedule.vessel.crewMembers,
                                        A.takeLeft(4),
                                        A.map((crew) => (
                                          <Avatar
                                            size="sm"
                                            name={crew.lastName}
                                            key={crew.crewMemberId}
                                          />
                                        ))
                                      )}
                                    </td>
                                  ) : null}
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </figure>
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
