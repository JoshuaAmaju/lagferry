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

export default function NewUser() {
  const toast = useToast();

  const mutation = useMutation(
    async (body: any) => {
      const http = get_api_http();
      const { data } = await http.post("/users/new", body);
      return data;
    },
    {
      onError() {
        toast({ status: "error", description: "An error occurred" });
      },
      onSuccess() {
        toast({ status: "success", description: "User created" });
      },
    }
  );

  return (
    <Layout>
      <SideNav active="users" />

      <div className="flex-1">
        <header className="page-header">
          <h1 className="page-title">Users</h1>
        </header>

        <div className="mx-auto w-[70%] space-y-8 px-6 py-12">
          <h2 className="text-lg font-bold">Add User</h2>

          <main>
            <form
              method="post"
              action="/users/new"
              className="space-y-12"
              onSubmit={(e) => {
                e.preventDefault();

                const formData = new FormData(e.target as HTMLFormElement);

                const data = Object.fromEntries(formData);

                mutation.mutate(data);
              }}
            >
              <div className="space-y-4">
                <div className="flex gap-6">
                  <FormControl>
                    <FormLabel>First Name</FormLabel>
                    <Input required type="text" name="firstname" />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Surname</FormLabel>
                    <Input required type="text" name="lastname" />
                  </FormControl>
                </div>

                <div className="flex gap-6">
                  <FormControl>
                    <FormLabel>Email</FormLabel>
                    <Input required type="email" name="email" />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Address</FormLabel>
                    <Input required type="text" name="address" />
                  </FormControl>
                </div>

                <div className="flex gap-6">
                  <FormControl>
                    <FormLabel>Phone Number</FormLabel>
                    <Input required type="tel" name="phoneNumber" />
                  </FormControl>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  colorScheme="blue"
                  className="w-[30%] !block mx-auto"
                  isLoading={mutation.isLoading}
                >
                  Publish
                </Button>
              </div>
            </form>
          </main>
        </div>
      </div>
    </Layout>
  );
}
