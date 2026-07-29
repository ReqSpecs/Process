"use client";

import { useState } from "react";
import {
  Buildings,
  CreditCard,
  Palette,
  Question,
  SlidersHorizontal,
  User,
  type Icon,
} from "@phosphor-icons/react";
import type { AccessState } from "@/lib/access";
import type { Currency } from "@/lib/constants";
import type { WorkspaceSettings } from "@/lib/ui/settings";
import { AccountSection } from "./AccountSection";
import { AppearanceSection } from "./AppearanceSection";
import { BillingSection } from "./BillingSection";
import { DefaultsSection } from "./DefaultsSection";
import { HelpSection } from "./HelpSection";
import { WorkspaceSection } from "./WorkspaceSection";

type TabId =
  | "account"
  | "workspace"
  | "appearance"
  | "defaults"
  | "billing"
  | "help";

const TABS: { id: TabId; label: string; icon: Icon }[] = [
  { id: "account", label: "Account", icon: User },
  { id: "workspace", label: "Workspace", icon: Buildings },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "defaults", label: "Project defaults", icon: SlidersHorizontal },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "help", label: "Help & support", icon: Question },
];

export type SignInInfo = { providers: string[]; hasPassword: boolean };

export function SettingsShell({
  name,
  email,
  signIn,
  workspaceName,
  description,
  settings,
  access,
  billing,
  banners,
  initialTab,
}: {
  name: string;
  email: string;
  signIn: SignInInfo;
  workspaceName: string;
  description: string;
  settings: WorkspaceSettings;
  access: AccessState;
  billing: {
    symbol: string;
    currency: Currency;
    hasSubscription: boolean;
  };
  banners: {
    checkoutSuccess: boolean;
    billingNotConfigured: boolean;
    upgrade: boolean;
    cancelled: boolean;
    deletedData: boolean;
  };
  initialTab: string;
}) {
  const valid = TABS.some((t) => t.id === initialTab);
  const [tab, setTab] = useState<TabId>(valid ? (initialTab as TabId) : "account");

  const changeTab = (id: TabId) => {
    setTab(id);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", id);
      window.history.replaceState(null, "", url.toString());
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl gap-8 px-6 py-10 sm:px-10">
      <aside className="hidden w-52 shrink-0 sm:block">
        <h1 className="px-3 text-[13px] font-semibold uppercase tracking-wide text-ink-faint">
          Settings
        </h1>
        <nav className="mt-3 space-y-0.5">
          {TABS.map(({ id, label, icon: I }) => (
            <button
              key={id}
              onClick={() => changeTab(id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors ${
                tab === id
                  ? "bg-mist text-ink"
                  : "text-ink-soft hover:bg-mist/60 hover:text-ink"
              }`}
            >
              <I size={16} weight="bold" className="text-ink-faint" />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        {/* mobile tab selector */}
        <div className="mb-5 flex gap-1 overflow-x-auto sm:hidden">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => changeTab(id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[12.5px] font-semibold ${
                tab === id ? "bg-ink text-white" : "bg-mist text-ink-soft"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <Banners banners={banners} access={access} />

        {tab === "account" && (
          <AccountSection
            name={name}
            email={email}
            signIn={signIn}
            settings={settings}
          />
        )}
        {tab === "workspace" && (
          <WorkspaceSection
            workspaceName={workspaceName}
            description={description}
            settings={settings}
          />
        )}
        {tab === "appearance" && <AppearanceSection settings={settings} />}
        {tab === "defaults" && <DefaultsSection settings={settings} />}
        {tab === "billing" && (
          <BillingSection
            access={access}
            symbol={billing.symbol}
            currency={billing.currency}
            hasSubscription={billing.hasSubscription}
          />
        )}
        {tab === "help" && <HelpSection />}
      </div>
    </div>
  );
}

function Banners({
  banners,
  access,
}: {
  banners: {
    checkoutSuccess: boolean;
    billingNotConfigured: boolean;
    upgrade: boolean;
    cancelled: boolean;
    deletedData: boolean;
  };
  access: AccessState;
}) {
  return (
    <div className="mb-5 space-y-3 empty:mb-0">
      {banners.checkoutSuccess && (
        <Note tone="cobalt">
          You&apos;re subscribed — thank you for backing ProDraw early.
        </Note>
      )}
      {banners.cancelled && (
        <Note tone="gold">
          Your subscription will end at the close of the current billing period.
        </Note>
      )}
      {banners.deletedData && (
        <Note tone="gold">All projects and their data have been deleted.</Note>
      )}
      {banners.billingNotConfigured && (
        <Note tone="ember">
          Billing isn&apos;t configured yet. Please try again later.
        </Note>
      )}
      {banners.upgrade && !access.canEdit && (
        <Note tone="ember">
          Your trial has ended. Subscribe below to keep editing — your work is
          safe.
        </Note>
      )}
    </div>
  );
}

function Note({
  tone,
  children,
}: {
  tone: "cobalt" | "gold" | "ember";
  children: React.ReactNode;
}) {
  const cls =
    tone === "cobalt"
      ? "bg-cobalt-wash text-cobalt"
      : tone === "gold"
        ? "bg-gold-tint text-gold"
        : "bg-ember-tint text-ink";
  return (
    <p className={`rounded-lg px-4 py-3 text-[13.5px] font-medium ${cls}`}>
      {children}
    </p>
  );
}
