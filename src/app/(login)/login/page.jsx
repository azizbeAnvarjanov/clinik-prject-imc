"use client";
import { Input } from "@/components/ui/input";
import { login, signup } from "./actions";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { LoaderCircleIcon } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(""); // har yangi urinishda xatolikni tozalaymiz

    const formData = new FormData(e.target);
    const result = await login(formData);

    if (result?.error) {
      setLoading(false);
      setError(result.error);
      return;
    }

    setLoading(false);
  };
  return (
    <div className="flex justify-center items-center min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="border p-8 rounded-xl shadow-md w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Tizimga kirish</h1>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <Label htmlFor="email">Email:</Label>
        <Input className="mb-3" id="email" name="email" type="email" required />
        <Label htmlFor="password">Parol:</Label>
        <Input id="password" name="password" type="password" required />
        <Button disabled={loading} className="flex w-full mt-4" type="submit">
          Log in
          {loading && (
            <LoaderCircleIcon
              className="animate-spin"
              size={16}
              aria-hidden="true"
            />
          )}
        </Button>
        {/* <Button formAction={signup}>Sign up</Button> */}
      </form>
    </div>
  );
}
