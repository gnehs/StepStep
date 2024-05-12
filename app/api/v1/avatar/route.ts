import { getUserById } from "@/services/actions/auth";
import crypto from "crypto";
export async function GET(request: Request) {
  let avatarUrl = `https://www.gravatar.com/avatar/`;
  // get id from query string
  const urlParams = new URLSearchParams(request.url);
  const id = urlParams.get("id");
  if (id) {
    const user = await getUserById(id!);
    if (user) {
      const hash = crypto
        .createHash("sha256")
        .update(user.email.toLowerCase().trim())
        .digest("hex");
      avatarUrl = `https://www.gravatar.com/avatar/${hash}`;
    }
  }
  // proxy the image
  const avatar = await fetch(avatarUrl);
  const avatarBuffer = await avatar.arrayBuffer();
  return new Response(avatarBuffer, {
    headers: {
      "Content-Type": avatar.headers.get("Content-Type")!,
    },
  });
}
