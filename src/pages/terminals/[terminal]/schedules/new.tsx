import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
} from "@chakra-ui/react";

import { get_sessionConfig } from "@/common/utils/session";
import { withIronSessionSsr } from "iron-session/next";

import * as E from "fp-ts/Either";
import * as A from "fp-ts/Array";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";

import { get_http as get_api_http } from "@/common/http";
import { get_http, get_http_with_token_refresh } from "@/core/common/http";

import { get_env } from "@/core/common/env";
import { get_terminals } from "@/core/usecases/terminal";
import { Terminal } from "@/core/models/terminal";
import { useMutation } from "react-query";
import { Layout } from "@/common/components/layout";
import { SideNav } from "@/common/components/sidenav";
import { get_vessels } from "@/core/usecases/vessel";
import { get_routes } from "@/core/usecases/route";
import { Route } from "@/core/models/route";
import { Vessel } from "@/core/models/vessel";
import { useState } from "react";

type Props = {
  terminal: number;
  data: E.Either<
    string,
    {
      routes: Array<Route>;
      vessels: Array<Vessel>;
      terminals: Array<Terminal>;
    }
  >;
};

export const getServerSideProps = withIronSessionSsr(({ req, query }) => {
  const { auth } = req.session as any;

  const env = get_env();

  const { terminal } = query;

  const http = get_http_with_token_refresh(() => get_http(env))(auth)(
    (newAuth) => {
      console.log("newAuth", newAuth);
    }
  );

  const run = pipe(
    TE.fromEither(http),
    TE.chain((http) => {
      return pipe(
        TE.Do,
        TE.bind("routes", () => get_routes(http)),
        TE.bind("vessels", () => get_vessels(http)),
        TE.bind("terminals", () => get_terminals(http))
      );
    })
  );

  return run().then(
    E.matchW(
      (err) => {
        return err instanceof Error
          ? { props: { error: E.left(err.message) } }
          : err?.status === 401
          ? { redirect: { destination: `/auth/login?continue_to=${req.url}` } }
          : { props: { error: E.left("An error occurred") } };
      },
      (result) => {
        return { props: { terminal, data: E.right(result) } } as any;
      }
    )
  );
}, get_sessionConfig());

export default function NewSchedule({ data }: Props) {
  const toast = useToast();

  const [selected_terminal, set_selected_terminal] = useState<
    Terminal["terminalId"] | null
  >(null);

  const mutation = useMutation(
    async (body: any) => {
      const http = get_api_http();
      const { data } = await http.post("/schedules/new", body);
      return data;
    },
    {
      onError() {
        toast({ status: "error", description: "An error occurred" });
      },
      onSuccess() {
        toast({ status: "success", description: "Schedule created" });
      },
    }
  );

  console.log(data);

  const terminals = pipe(
    data,
    E.match(
      () => <></>,
      ({ terminals }) => {
        return (
          <>
            {pipe(
              terminals,
              A.map((terminal) => {
                return (
                  <option
                    key={terminal.terminalId}
                    value={terminal.terminalId}
                    disabled={terminal.terminalId == selected_terminal}
                  >
                    {terminal.name}
                  </option>
                );
              })
            )}
          </>
        );
      }
    )
  );

  return (
    <Layout>
      <SideNav active="terminals" />

      <div className="flex-1">
        <header className="page-header">
          <h1 className="page-title">Schedule</h1>
        </header>

        <div className="p-6">
          <div className="mx-auto lg:w-[70%] bg-white rounded-md space-y-8 lg:p-12 p-6">
            <h2 className="text-lg font-bold">Add Schedule</h2>

            <main>
              <form
                method="post"
                action="/schedules/new"
                className="space-y-12"
                onSubmit={(e) => {
                  e.preventDefault();

                  const formData = new FormData(e.target as HTMLFormElement);

                  const data = Object.fromEntries(formData);

                  mutation.mutate(data);
                }}
              >
                <div className="space-y-4">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <FormControl>
                      <FormLabel>Departure</FormLabel>
                      <Select
                        required
                        name="startTerminal"
                        placeholder="Select terminal"
                        onChange={(e) => {
                          set_selected_terminal(e.target.value as any);
                        }}
                      >
                        {terminals}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Destination</FormLabel>
                      <Select
                        required
                        name="endTerminal"
                        placeholder="Select terminal"
                        onChange={(e) => {
                          set_selected_terminal(e.target.value as any);
                        }}
                      >
                        {terminals}
                      </Select>
                    </FormControl>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-6">
                    <FormControl>
                      <FormLabel>Route</FormLabel>
                      <Select required name="route" placeholder="Select route">
                        {pipe(
                          data,
                          E.match(
                            () => <></>,
                            ({ routes }) => {
                              return (
                                <>
                                  {pipe(
                                    routes,
                                    A.map((route) => {
                                      return (
                                        <option
                                          key={route.routeId}
                                          value={route.routeId}
                                        >
                                          {route.name}
                                        </option>
                                      );
                                    })
                                  )}
                                </>
                              );
                            }
                          )
                        )}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Time</FormLabel>
                      <Input
                        required
                        type="time"
                        name="scheduleTime"
                        placeholder="Select terminal"
                      />
                    </FormControl>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-6">
                    <FormControl>
                      <FormLabel>Vessel</FormLabel>

                      <Select
                        required
                        name="vessel"
                        placeholder="Select vessel"
                      >
                        {pipe(
                          data,
                          E.match(
                            () => <></>,
                            ({ vessels }) => {
                              return (
                                <>
                                  {pipe(
                                    vessels,
                                    A.map((vessel) => {
                                      return (
                                        <option
                                          key={vessel.vesselId}
                                          value={vessel.vesselId}
                                        >
                                          {vessel.name}
                                        </option>
                                      );
                                    })
                                  )}
                                </>
                              );
                            }
                          )
                        )}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Date</FormLabel>
                      <Input required type="date" name="scheduleDate" />
                    </FormControl>
                  </div>
                </div>

                <div>
                  <Button
                    type="submit"
                    colorScheme="blue"
                    isLoading={mutation.isLoading}
                    className="lg:w-[30%] w-full !block mx-auto"
                  >
                    Publish
                  </Button>
                </div>
              </form>
            </main>
          </div>
        </div>
      </div>
    </Layout>
  );
}
