"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeReturnTo(value: FormDataEntryValue | null) {
  const returnTo = String(value || "/dashboard/agent/messages");
  if (!returnTo.startsWith("/dashboard/agent/messages") && !returnTo.startsWith("/dashboard/seeker/messages")) {
    return "/dashboard/agent/messages";
  }
  return returnTo;
}

export async function sendConversationMessageAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const returnTo = safeReturnTo(formData.get("return_to"));
  const conversationId = String(formData.get("conversation_id") || "");
  const message = String(formData.get("message") || "").trim();

  if (!conversationId || !message) {
    redirect(returnTo);
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .select("conversation_id, request_id, home_seeker_user_id, agent_user_id")
    .eq("conversation_id", conversationId)
    .maybeSingle();

  if (!conversation || (conversation.home_seeker_user_id !== user.id && conversation.agent_user_id !== user.id)) {
    redirect(returnTo);
  }

  const receiverId = conversation.agent_user_id === user.id ? conversation.home_seeker_user_id : conversation.agent_user_id;
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversation.conversation_id,
    sender_id: user.id,
    receiver_id: receiverId,
    request_id: conversation.request_id,
    message
  });

  if (error) {
    redirect(`${returnTo}?message_error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/agent/messages");
  revalidatePath("/dashboard/seeker/messages");
  redirect(returnTo);
}
