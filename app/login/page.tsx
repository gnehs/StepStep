"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";
import PageTitle from "@/components/PageTitle";
import SectionTitle from "@/components/SectionTitle";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { login } from "@/services/actions/auth";
import { useLocalStorage } from "usehooks-ts";
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useLocalStorage("token", "");
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      let res = await login({ email, password });
      if (!res.success) {
        alert(res.message);
        return;
      }
      setToken(res.token!);
      router.push("/");
    } catch (error) {}
  }

  return (
    <Container>
      <PageTitle>登入</PageTitle>
      <form onSubmit={onSubmit}>
        <SectionTitle className="mb-1 mt-2">Email</SectionTitle>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <SectionTitle className="mb-1 mt-2">密碼</SectionTitle>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button className="mt-4 w-full" type="submit">
          登入
        </Button>
      </form>
    </Container>
  );
}
