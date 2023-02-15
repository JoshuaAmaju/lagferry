import { Button, FormControl, FormLabel, Input } from "@chakra-ui/react";
import Link from "next/link";

export default function Login() {
  return (
    <div className="flex items-center justify-evenly h-full bg-slate-50">
      <div className="w-[10rem] h-[10rem] bg-gray-200" />

      <main className="w-[25rem] bg-white rounded-md p-6 space-y-10">
        <h4 className="text-2xl font-bold">Login</h4>

        <form className="space-y-10">
          <div className="space-y-6">
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input type="email" name="email" required />
            </FormControl>

            <div className="space-y-2">
              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input type="password" name="password" required />
              </FormControl>

              <div className="flex justify-end">
                <Link href="/forgot_password">forgot password?</Link>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
      </main>
    </div>
  );
}
