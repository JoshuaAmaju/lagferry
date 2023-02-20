import { get_sessionConfig } from "@/common/utils/session";
import { withIronSessionSsr } from "iron-session/next";

import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";

import { Layout } from "@/common/components/layout";
import { SideNav } from "@/common/components/sidenav";
import { get_env } from "@/core/common/env";
import { get_http, get_http_with_token_refresh } from "@/core/common/http";
import Link from "next/link";

import { User } from "@/core/models/user";
import { get_users } from "@/core/usecases/user";
import { Avatar, Button, Select, Tag } from "@chakra-ui/react";
import { inspect } from "util";
import { useRouter } from "next/router";

type Props = { data: E.Either<string, Array<User>> };

export const getServerSideProps = withIronSessionSsr(({ req }) => {
  const { auth } = req.session as any;

  const env = get_env();

  const http = get_http_with_token_refresh(() => get_http(env))(auth)(
    (newAuth) => {
      console.log("refresh", newAuth);
    }
  );

  const run = pipe(TE.fromEither(http), TE.chain(get_users));

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

enum Status {
  enabled = "enabled",
  disabled = "disabled",
}

export default function Users(props: Props) {
  const router = useRouter();

  const { status = "" } = router.query;

  const _status = typeof status === "string" ? (status as Status) : null;

  const users_by_status = pipe(
    props.data,
    E.map((users) => {
      return pipe(
        O.fromNullable(_status),
        O.filter((status) => status.trim() !== ""),
        O.map((status) => {
          return pipe(
            users,
            A.filter((user) => {
              return status === Status.enabled ? user.enabled : !user.enabled;
            })
          );
        }),
        O.getOrElse(() => users)
      );
    })
  );

  return (
    <Layout>
      <SideNav active="users" />

      <div className="flex-1">
        <header className="page-header">
          <h1 className="page-title">Users</h1>
        </header>

        <main className="p-6 space-y-6">
          <div className="flex justify-between">
            <Select
              value={status}
              maxW="max-content"
              onChange={(e) => {
                router.push(`?status=${e.target.value}`);
              }}
            >
              <option value="">All</option>
              <option value={Status.enabled}>Enabled</option>
              <option value={Status.disabled}>Disabled</option>
            </Select>

            <Button as={Link} href="/users/new" colorScheme="blue">
              Add User
            </Button>
          </div>

          {pipe(
            users_by_status,
            E.match(
              () => <></>,
              (users) => {
                return (
                  <ul className="lg:flex gap-8 flex-wrap lg:grid grid-cols-3">
                    {pipe(
                      users,
                      A.map((user) => {
                        const name = `${user.lastname} ${user.firstname}`;

                        return (
                          <li key={user.userId} className="flex-1">
                            <Link
                              href={`/users/${user.userId}`}
                              className="flex items-center justify-between gap-4 bg-white p-4 rounded-md flex-wrap"
                            >
                              <div className="flex space-x-4">
                                <Avatar name={name} size="md" />

                                <div className="flex-1 space-y-1">
                                  <p className="text-lg font-bold">{name}</p>

                                  <Tag
                                    size="sm"
                                    variant="subtle"
                                    colorScheme={user.enabled ? "green" : "red"}
                                  >
                                    {user.enabled ? "enabled" : "disabled"}
                                  </Tag>
                                </div>
                              </div>

                              <Button size="sm">
                                {user.enabled ? "Disable" : "Enable"}
                              </Button>
                            </Link>
                          </li>
                        );
                      })
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
