"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";
import PageTitle from "@/components/PageTitle";
import SectionTitle from "@/components/SectionTitle";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { createUser } from "@/services/actions/user";
export default function Register() {
  const router = useRouter();

  const [inviteCode, setInviteCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  useEffect(() => {
    // get invite code from query string
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get("rel");
    if (inviteCode) {
      setInviteCode(inviteCode);
    }
  }, []);
  async function onFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("密碼不一致");
      return;
    }
    try {
      let res = await createUser({ inviteCode, name, email, password });
      if (!res.success) {
        alert(res.message);
        return;
      }
      router.push("/login");
    } catch (error) {}
  }
  return (
    <Container>
      <PageTitle>註冊</PageTitle>
      <form onSubmit={onFormSubmit}>
        <SectionTitle className="mb-1 mt-2">邀請碼</SectionTitle>
        <Input
          id="invite-code"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          required
        />
        <SectionTitle className="mb-1 mt-2">暱稱</SectionTitle>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <SectionTitle className="mb-1 mt-2">Email</SectionTitle>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <p className="mt-1 text-balance text-xs opacity-75">
          我們會透過 Gravatar 來顯示你的大頭貼，請確保你的 Email 是正確的。
        </p>
        <SectionTitle className="mb-1 mt-2">密碼</SectionTitle>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <SectionTitle className="mb-1 mt-2">確認密碼</SectionTitle>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <Button className="my-4 w-full" type="submit">
          註冊
        </Button>
      </form>
      <p className="text-balance text-center text-sm opacity-75">
        如果你弄丟了密碼，你將永遠無法找回你的帳號。
      </p>
    </Container>
  );
}
