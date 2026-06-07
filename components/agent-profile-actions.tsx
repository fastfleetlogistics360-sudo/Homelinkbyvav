"use client";

import Link from "next/link";
import { useState } from "react";
import { Archive, IdCard, LockKeyhole, Pencil, ShieldCheck, X } from "lucide-react";
import { sendPasswordResetAction } from "@/lib/actions/auth";

type AgentProfileActionsProps = {
  activityItems: string[];
  passwordError?: string;
  passwordSent?: boolean;
};

export function AgentProfileActions({ activityItems, passwordError, passwordSent }: AgentProfileActionsProps) {
  const [activityOpen, setActivityOpen] = useState(false);

  return (
    <section className="agent-profile-actions-card">
      <h3>Quick Actions</h3>
      {passwordSent ? <p className="agent-profile-action-alert success">Password reset link sent to your email.</p> : null}
      {passwordError ? <p className="agent-profile-action-alert error">{passwordError}</p> : null}
      <div className="agent-profile-actions-grid">
        <Link href="/dashboard/agent/kyc">
          <span>
            <Pencil size={30} />
          </span>
          Edit Profile
        </Link>
        <Link href="/dashboard/agent/kyc">
          <span>
            <ShieldCheck size={30} />
          </span>
          Update KYC
        </Link>
        <form action={sendPasswordResetAction}>
          <input name="return_to" type="hidden" value="/dashboard/agent/profile" />
          <button type="submit">
            <span>
              <LockKeyhole size={30} />
            </span>
            Change Password
          </button>
        </form>
        <button onClick={() => setActivityOpen(true)} type="button">
          <span>
            <Archive size={30} />
          </span>
          Activity Log
        </button>
      </div>

      {activityOpen ? (
        <div className="agent-profile-activity-panel">
          <div>
            <strong>Activity Log</strong>
            <button aria-label="Close activity log" onClick={() => setActivityOpen(false)} type="button">
              <X size={18} />
            </button>
          </div>
          <ul>
            {activityItems.map((item) => (
              <li key={item}>
                <IdCard size={18} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
