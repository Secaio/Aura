import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { useChatStore } from "@/store/chat";

export async function POST() {
  (await cookies()).delete("session");
 
  //useChatStore.getState().clearMessages(); // você precisa ter esse método

  return NextResponse.json({ ok: true });
}
