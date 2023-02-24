import { get_sessionConfig } from "@/common/utils/session";
import { withIronSessionSsr } from "iron-session/next";

import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";

import { Layout } from "@/common/components/layout";
import { SideNav } from "@/common/components/sidenav";
import { get_env } from "@/core/common/env";
import { get_http, get_http_with_token_refresh } from "@/core/common/http";
import type { User } from "@/core/models/user";
import { get_users } from "@/core/usecases/user";
import { Avatar } from "@chakra-ui/react";
import createHttpError from "http-errors";
import { inspect } from "util";

type Props = { data: E.Either<string, O.Option<User>> };

export const getServerSideProps = withIronSessionSsr(({ req, query }) => {
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
      const { user } = query;

      return typeof user !== "string"
        ? E.left(createHttpError.BadRequest())
        : E.right(user);
    }),
    TE.chain((user) => {
      return pipe(
        TE.fromEither(http),
        TE.chain((http) =>
          pipe(
            get_users(http),
            TE.map(A.findFirst((_user) => _user.userId === user))
          )
        )
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

export default function User({ data }: Props) {
  console.log(data);

  return (
    <Layout>
      <SideNav active="users" />

      <div className="flex-1">
        <header className="page-header">
          <h1 className="page-title">User</h1>
        </header>

        <main className="p-6">
          {pipe(
            data,
            E.match(
              () => <></>,
              O.match(
                () => <></>,
                (user) => {
                  const name = `${user.lastname} ${user.firstname}`;

                  return (
                    <div className="space-y-6 lg:w-[50%] mx-auto">
                      <div className="p-8 rounded-md bg-white text-center space-y-4">
                        <Avatar size="2xl" name={name} />
                        <h2 className="text-2xl font-bold">{name}</h2>
                      </div>

                      <figure className="space-y-6 bg-white p-6 rounded-md">
                        <figcaption className="text-lg font-bold">
                          Contact Details
                        </figcaption>

                        <div className="divide-y">
                          <div className="p-6">
                            <h4>Address</h4>
                            <p className="font-semibold">{user.address}</p>
                          </div>

                          <div className="p-6">
                            <h4>Phone Number</h4>
                            <p className="font-semibold">{user.phonenumber}</p>
                          </div>

                          <div className="p-6">
                            <h4>Email</h4>
                            <p className="font-semibold">{user.email}</p>
                          </div>
                        </div>
                      </figure>
                    </div>
                  );
                }
              )
            )
          )}
        </main>
      </div>
    </Layout>
  );
}
