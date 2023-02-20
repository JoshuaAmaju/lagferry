import {
  Button,
  FormControl,
  FormLabel,
  Input,
  useToast,
} from "@chakra-ui/react";
import Link from "next/link";
import { useMutation } from "react-query";

import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { get_http } from "@/common/http";
import { HttpError } from "@/types/http";
import { isAxiosError } from "axios";
import { useRouter } from "next/router";

type Credentials = {
  username: string;
  password: string;
};

export default function Login() {
  const toast = useToast();

  const router = useRouter();

  const { continue_to = "/" } = router.query;

  const mutation = useMutation(
    (data: Credentials) => {
      const http = get_http();
      const run = TE.tryCatch(
        () => http.post("/auth/login", data),
        (e) =>
          isAxiosError(e) ? (e.response?.data as HttpError) : (e as Error)
      );
      return run();
    },
    {
      onSuccess(data) {
        if (E.isLeft(data)) {
          toast({ description: data.left.message, status: "error" });
        } else {
          toast({ description: "Login successful", status: "success" });
          router.replace(typeof continue_to === "string" ? continue_to : "/");
        }
      },
    }
  );

  return (
    <div className="flex items-center justify-evenly h-full bg-slate-50">
      <div className="w-[10rem] h-[10rem] bg-gray-200" />

      <main className="w-[25rem] bg-white rounded-md p-6 space-y-10">
        <h4 className="text-2xl font-bold">Login</h4>

        <form
          className="space-y-10"
          onSubmit={(e) => {
            e.preventDefault();

            const formData = new FormData(e.target as HTMLFormElement);

            const data = Object.fromEntries(formData);

            mutation.mutate(data as Credentials);
          }}
        >
          <div className="space-y-6">
            <FormControl isRequired>
              <FormLabel>Username</FormLabel>
              <Input type="text" name="username" required />
            </FormControl>

            <div className="space-y-2">
              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  required
                  minLength={6}
                  maxLength={40}
                  type="password"
                  name="password"
                />
              </FormControl>

              <div className="flex justify-end">
                <Link href="/forgot_password">Forgot password?</Link>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            isLoading={mutation.isLoading}
            className="w-full"
          >
            Login
          </Button>
        </form>
      </main>
    </div>
  );
}
