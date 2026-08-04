"use client";

import { useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Camera, Check, LoaderCircle } from "lucide-react";
import type { IssueCategory, ProcessingStage } from "@/lib/domain";
import { STAGE_LABELS } from "@/lib/domain";
import { prepareImage } from "@/lib/image";
import { createClient } from "@/lib/supabase/browser";
import { PHOTO_BUCKET } from "@/lib/config";
import { issueSchema } from "@/lib/validation";

interface FormValues {
  processingStage: ProcessingStage | "";
  categoryId: string;
  comment: string;
}

export function IssueReportForm({
  trayId,
  trayCode,
  sampleId,
  sampleNumber,
  categories,
}: {
  trayId: string;
  trayCode: string;
  sampleId: string;
  sampleNumber: string;
  categories: IssueCategory[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { control, register, setValue, getValues, formState: { errors } } = useForm<FormValues>({
    defaultValues: { processingStage: "", categoryId: "", comment: "" },
  });
  const categoryId = useWatch({ control, name: "categoryId" });
  const stage = useWatch({ control, name: "processingStage" });
  const selectedCategory = categories.find((category) => category.id === categoryId);

  function selectCategory(category: IssueCategory) {
    setValue("categoryId", category.id, { shouldValidate: true });
    if (!getValues("processingStage") && category.default_stage) {
      setValue("processingStage", category.default_stage);
    }
    setError("");
  }

  function openCamera() {
    const values = getValues();
    if (!values.processingStage) return setError("Select where the issue occurred.");
    if (!values.categoryId) return setError("Select an issue reason.");
    if (selectedCategory?.requires_comment && !values.comment.trim()) return setError("Add a comment for Other.");
    setError("");
    inputRef.current?.click();
  }

  async function removeOrphan(path: string) {
    try {
      await fetch("/api/photos/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
    } catch {
      // Server-side maintenance can identify unlinked objects; never hide the primary failure.
    }
  }

  async function captureAndSubmit(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError("");
    const issueId = crypto.randomUUID();
    const idempotencyKey = crypto.randomUUID();
    const path = `${trayId}/${sampleId}/${issueId}/${Date.now()}-${crypto.randomUUID()}.jpg`;
    let uploaded = false;

    try {
      setStatus("Preparing photograph…");
      const photo = await prepareImage(file);
      const values = getValues();
      const payload = issueSchema.parse({
        issueId,
        idempotencyKey,
        trayId,
        sampleId,
        categoryId: values.categoryId,
        processingStage: values.processingStage,
        comment: values.comment,
        photoStoragePath: path,
        photoMimeType: "image/jpeg",
        photoSizeBytes: photo.size,
      });

      if (!navigator.onLine) throw new Error("You are offline. Reconnect and take the photograph again.");
      setStatus("Uploading photographic evidence…");
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage.from(PHOTO_BUCKET).upload(path, photo, {
        contentType: "image/jpeg",
        cacheControl: "0",
        upsert: false,
      });
      if (uploadError) throw new Error("The photograph could not be uploaded. Check your connection and try again.");
      uploaded = true;

      setStatus("Saving issue record…");
      const { error: issueError } = await supabase.rpc("create_sample_issue", {
        p_issue_id: payload.issueId,
        p_tray_id: payload.trayId,
        p_sample_id: payload.sampleId,
        p_category_id: payload.categoryId,
        p_processing_stage: payload.processingStage,
        p_comment: payload.comment || null,
        p_photo_storage_path: payload.photoStoragePath,
        p_photo_mime_type: payload.photoMimeType,
        p_photo_size_bytes: payload.photoSizeBytes,
        p_idempotency_key: payload.idempotencyKey,
      });
      if (issueError) throw new Error(issueError.message.includes("duplicate") ? "This issue was already submitted." : "The issue could not be saved. The uploaded photograph will be removed.");

      setStatus("Issue saved.");
      void fetch("/api/notifications/deliver", { method: "POST", keepalive: true }).catch(() => undefined);
      event.target.value = "";
      router.push(`/operator/trays/${trayCode}?submitted=1`);
      router.refresh();
    } catch (caught) {
      if (uploaded) await removeOrphan(path);
      event.target.value = "";
      setError(caught instanceof Error ? caught.message : "The issue could not be submitted. Try again.");
      setStatus("");
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="rounded-[20px] bg-[#17211d] p-5 text-center text-white">
        <p className="text-xs font-bold uppercase tracking-[.13em] text-[#b8c9c0]">Reporting issue for sample</p>
        <p className="mt-2 text-5xl font-black tracking-[-.05em] text-[var(--lime)]">{sampleNumber}</p>
      </div>
      {error && <div className="notice notice-error mt-4" role="alert">{error}</div>}
      <div className="sr-only" aria-live="polite">{status}</div>

      <fieldset className="mt-8">
        <legend className="text-lg font-black">1. Where did it happen?</legend>
        <Controller control={control} name="processingStage" rules={{ required: true }} render={() => (
          <div className="mt-4 grid gap-3">
            {(Object.keys(STAGE_LABELS) as ProcessingStage[]).map((value) => (
              <button key={value} type="button" className={`btn min-h-14 justify-between text-left ${stage === value ? "border-[var(--green)] bg-[#e7f4ed] text-[var(--green-dark)]" : "btn-secondary"}`} onClick={() => setValue("processingStage", value, { shouldValidate: true })} aria-pressed={stage === value} disabled={submitting}>
                {STAGE_LABELS[value]} {stage === value && <Check size={20} aria-hidden />}
              </button>
            ))}
          </div>
        )} />
      </fieldset>

      <fieldset className="mt-9">
        <legend className="text-lg font-black">2. What’s the issue?</legend>
        <input type="hidden" {...register("categoryId", { required: true })} />
        <div className="mt-4 grid gap-3">
          {categories.map((category) => (
            <button key={category.id} type="button" className={`btn min-h-16 justify-between text-left ${categoryId === category.id ? "border-[var(--green)] bg-[#e7f4ed] text-[var(--green-dark)]" : "btn-secondary"}`} onClick={() => selectCategory(category)} aria-pressed={categoryId === category.id} disabled={submitting}>
              <span>{category.name}</span>{categoryId === category.id && <Check size={20} aria-hidden />}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-9">
        <label className="label" htmlFor="comment">3. Comment {selectedCategory?.requires_comment ? "(required)" : "(optional)"}</label>
        <textarea id="comment" className="field min-h-28 resize-y" maxLength={2000} placeholder={selectedCategory?.requires_comment ? "Describe the issue" : "Add context if useful"} disabled={submitting} {...register("comment", { required: selectedCategory?.requires_comment })} />
        {errors.comment && <p className="mt-2 text-sm font-bold text-[var(--red)]">A comment is required for this issue.</p>}
      </div>

      <div className="mt-9 rounded-[22px] border-2 border-[var(--green)] bg-white p-4">
        <p className="text-center text-sm font-extrabold">Reporting issue for sample {sampleNumber}</p>
        <button type="button" className="btn btn-primary mt-3 w-full !min-h-[68px] text-lg" onClick={openCamera} disabled={submitting || !stage || !categoryId}>
          {submitting ? <LoaderCircle className="animate-spin" size={25} aria-hidden /> : <Camera size={25} aria-hidden />}
          {submitting ? status || "Submitting…" : "Take Photo and Submit Issue"}
        </button>
        <input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={captureAndSubmit} tabIndex={-1} />
        <p className="muted mt-3 text-center text-xs leading-5">Taking the photo is final confirmation. Keep this screen open until submission succeeds.</p>
      </div>
    </div>
  );
}
