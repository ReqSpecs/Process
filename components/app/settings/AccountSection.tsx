"use client";

import { useActionState, useState, useTransition } from "react";
import { ConfirmDeleteModal } from "@/components/app/ConfirmDeleteModal";
import {
  deleteAccount,
  deleteAllData,
  saveWorkspaceSettings,
  updateAccountName,
} from "@/app/(app)/settings/actions";
import { updatePassword } from "@/app/(auth)/actions";
import type { WorkspaceSettings } from "@/lib/ui/settings";
import type { SignInInfo } from "./SettingsShell";
import { Card, Field, PrimaryButton, Row, TextInput, Toggle } from "./ui";

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  azure: "Microsoft",
};

export function AccountSection({
  name,
  email,
  signIn,
  settings,
}: {
  name: string;
  email: string;
  signIn: SignInInfo;
  settings: WorkspaceSettings;
}) {
  const [marketing, setMarketing] = useState(settings.emails.marketing);
  const [, startTransition] = useTransition();
  const [modal, setModal] = useState<null | "data" | "account">(null);
  const [pwState, pwAction, pwPending] = useActionState(updatePassword, null);

  const linked = signIn.providers
    .filter((p) => p !== "email")
    .map((p) => PROVIDER_LABELS[p] ?? p);

  const setMarketingPref = (v: boolean) => {
    setMarketing(v);
    startTransition(() => saveWorkspaceSettings({ emails: { marketing: v } }));
  };

  return (
    <div className="space-y-5">
      <Card title="Profile" desc="How you appear in ProDraw.">
        <form action={updateAccountName}>
          <Field label="Name" htmlFor="acct-name">
            <TextInput id="acct-name" name="name" defaultValue={name} placeholder="Your name" />
          </Field>
          <Field label="Email" hint="Contact support to change your email.">
            <TextInput value={email} readOnly />
          </Field>
          <div className="flex justify-end py-3.5">
            <PrimaryButton type="submit">Save</PrimaryButton>
          </div>
        </form>
      </Card>

      <Card title="Sign in" desc="How you get into ProDraw.">
        <Row
          label="Email code"
          hint={`Always available. We email a code and a sign-in link to ${email}.`}
        />
        {linked.length > 0 && (
          <Row
            label="Connected accounts"
            hint={`You can sign in with ${linked.join(" or ")}.`}
          />
        )}

        <form action={pwAction}>
          <input type="hidden" name="stay" value="1" />
          <input
            type="email"
            name="username"
            value={email}
            autoComplete="username"
            readOnly
            hidden
          />
          <Field
            label={signIn.hasPassword ? "Change password" : "Set a password"}
            hint={
              signIn.hasPassword
                ? "At least 8 characters."
                : "Optional — lets you sign in without waiting for an email."
            }
            htmlFor="acct-password"
          >
            <TextInput
              id="acct-password"
              name="password"
              type="password"
              placeholder="New password"
            />
          </Field>
          <Field label="Confirm password" htmlFor="acct-password-confirm">
            <TextInput
              id="acct-password-confirm"
              name="confirm"
              type="password"
              placeholder="Type it again"
            />
          </Field>
          <div className="flex items-center justify-end gap-3 py-3.5">
            {pwState?.error && (
              <span className="text-[12.5px] font-medium text-signal">
                {pwState.error}
              </span>
            )}
            {pwState?.sent && (
              <span className="text-[12.5px] font-medium text-cobalt">
                Password updated.
              </span>
            )}
            <PrimaryButton type="submit" disabled={pwPending}>
              {pwPending ? "Saving\u2026" : "Save password"}
            </PrimaryButton>
          </div>
        </form>
      </Card>

      <Card title="Email preferences">
        <Row label="Marketing emails" hint="Product news, tips, and the occasional update.">
          <Toggle checked={marketing} onChange={setMarketingPref} label="Marketing emails" />
        </Row>
      </Card>

      <Card title="Danger zone" desc="These actions are permanent and cannot be undone.">
        <Row
          label="Delete all data"
          hint="Removes every project, chevron, and process. Keeps your account and workspace."
        >
          <button
            onClick={() => setModal("data")}
            className="rounded-full border border-signal/40 px-4 py-2 text-[13px] font-semibold text-signal transition-colors hover:bg-ember-tint"
          >
            Delete data
          </button>
        </Row>
        <Row
          label="Delete account & workspace"
          hint="Cancels billing and permanently deletes your account and everything in it."
        >
          <button
            onClick={() => setModal("account")}
            className="rounded-full bg-signal px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:brightness-95"
          >
            Delete account
          </button>
        </Row>
      </Card>

      <ConfirmDeleteModal
        open={modal === "data"}
        title="Delete all data?"
        description="This permanently removes every project, chevron, and process in your workspace. Your account and workspace remain. This cannot be undone."
        confirmLabel="Delete all data"
        action={deleteAllData}
        onCancel={() => setModal(null)}
      />
      <ConfirmDeleteModal
        open={modal === "account"}
        title="Delete account & workspace?"
        description="This cancels your subscription and permanently deletes your account, workspace, and all data. You will be signed out. This cannot be undone."
        confirmLabel="Delete account"
        action={deleteAccount}
        onCancel={() => setModal(null)}
      />
    </div>
  );
}
