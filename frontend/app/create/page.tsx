"use client";

import { useState } from "react";
import { Camera, Tag, X } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pill } from "@/components/ui/Pill";

const CONDITIONS = ["Like new", "Very good", "Good", "Acceptable"];
const TYPES = ["Sell", "Swap", "Lend"];

export default function CreatePage() {
  const [condition, setCondition] = useState("Like new");
  const [type, setType] = useState("Sell");

  return (
    <PageLayout
      active="create"
      pageTitle="List a book"
      pageSubtitle="Share a book from your shelf with the community."
    >
      <form className="grid lg:grid-cols-[1fr_320px] gap-6 max-w-5xl">
        <div className="bc-card p-6 sm:p-8 flex flex-col gap-6">
          <FormSection title="Book details">
            <Field label="Title">
              <Input placeholder="e.g. The Overstory" />
            </Field>
            <Field label="Author">
              <Input placeholder="e.g. Richard Powers" />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="ISBN (optional)">
                <Input placeholder="978-..." />
              </Field>
              <Field label="Year">
                <Input placeholder="2018" />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Listing">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Listing type">
                <div className="flex gap-2">
                  {TYPES.map((t) => (
                    <Pill key={t} active={t === type} onClick={() => setType(t)}>
                      {t}
                    </Pill>
                  ))}
                </div>
              </Field>
              <Field label="Price">
                <Input
                  placeholder="0.00"
                  leftIcon={<span className="text-bc-subtext">$</span>}
                />
              </Field>
            </div>
            <Field label="Condition">
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((c) => (
                  <Pill
                    key={c}
                    active={c === condition}
                    onClick={() => setCondition(c)}
                  >
                    {c}
                  </Pill>
                ))}
              </div>
            </Field>
            <Field label="Description">
              <textarea
                rows={4}
                placeholder="A few notes about the book — its condition, why you loved it, why you're letting it go..."
                className="w-full rounded-bc-md bg-bc-surface border border-bc-border shadow-bc-xs p-4 text-sm text-bc-text placeholder:text-bc-subtext outline-none transition-all focus:border-bc-primary focus:shadow-bc-glow resize-none"
              />
            </Field>
          </FormSection>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="bc-card p-6 flex flex-col items-center text-center">
            <div className="w-full aspect-[3/4] rounded-bc-md border-2 border-dashed border-bc-border-strong grid place-items-center bg-bc-surface-muted text-bc-subtext mb-4">
              <Camera size={28} />
            </div>
            <Button variant="secondary" size="sm" fullWidth>
              Upload cover photo
            </Button>
            <p className="text-[11.5px] text-bc-subtext mt-3">
              JPG or PNG · Max 5MB
            </p>
          </div>

          <div className="bc-card p-6">
            <div className="flex items-center gap-2 mb-3 text-bc-text font-semibold text-sm">
              <Tag size={14} className="text-bc-primary" />
              Tags
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {["fiction", "literary", "nature"].map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-bc-primary-soft text-bc-primary text-[11.5px] font-semibold"
                >
                  {t}
                  <X size={11} className="cursor-pointer opacity-70 hover:opacity-100" />
                </span>
              ))}
            </div>
            <Input inputSize="sm" placeholder="Add tag..." />
          </div>

          <div className="flex flex-col gap-2">
            <Button size="lg" fullWidth>
              Publish listing
            </Button>
            <Button variant="ghost" size="md" fullWidth>
              Save as draft
            </Button>
          </div>
        </aside>
      </form>
    </PageLayout>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-[13px] font-bold uppercase tracking-[0.06em] text-bc-subtext">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[12.5px] font-semibold text-bc-text-soft">
        {label}
      </span>
      {children}
    </label>
  );
}
