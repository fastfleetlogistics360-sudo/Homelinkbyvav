import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const PROFILE_PHOTO_BUCKET = "agent-profile-photos";
const KYC_DOCUMENT_BUCKET = "agent-kyc-documents";
const HERO_IMAGE_BUCKET = "hero-images";
const TESTIMONIAL_PHOTO_BUCKET = "testimonial-photos";

function safeFileName(name: string) {
  const cleaned = name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned || "upload";
}

function isUsableFile(file: FormDataEntryValue | null): file is File {
  return typeof File !== "undefined" && file instanceof File && file.size > 0;
}

async function ensureBucket(bucket: string, isPublic: boolean) {
  const supabase = createAdminClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((item) => item.name === bucket)) return;

  await supabase.storage.createBucket(bucket, {
    public: isPublic,
    fileSizeLimit: 1024 * 1024 * 8,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"]
  });
}

async function uploadFile({
  bucket,
  file,
  folder,
  isPublic
}: {
  bucket: string;
  file: File;
  folder: string;
  isPublic: boolean;
}) {
  await ensureBucket(bucket, isPublic);
  const supabase = createAdminClient();
  const path = `${folder}/${randomUUID()}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false
  });

  if (error) throw new Error(error.message);

  if (isPublic) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  return `storage://${bucket}/${path}`;
}

export async function uploadAgentProfilePhoto(userId: string, fileEntry: FormDataEntryValue | null) {
  if (!isUsableFile(fileEntry)) return null;
  return uploadFile({
    bucket: PROFILE_PHOTO_BUCKET,
    file: fileEntry,
    folder: userId,
    isPublic: true
  });
}

export async function uploadHeroSlideImage(sortOrder: number, fileEntry: FormDataEntryValue | null) {
  if (!isUsableFile(fileEntry)) return null;
  return uploadFile({
    bucket: HERO_IMAGE_BUCKET,
    file: fileEntry,
    folder: `slide-${sortOrder}`,
    isPublic: true
  });
}

export async function uploadTestimonialPhoto(testimonialKey: string, fileEntry: FormDataEntryValue | null) {
  if (!isUsableFile(fileEntry)) return null;
  return uploadFile({
    bucket: TESTIMONIAL_PHOTO_BUCKET,
    file: fileEntry,
    folder: testimonialKey,
    isPublic: true
  });
}

export async function uploadAgentKycDocuments(userId: string, fileEntries: FormDataEntryValue[]) {
  const files = fileEntries.filter(isUsableFile);
  const uploads = await Promise.all(
    files.map((file) =>
      uploadFile({
        bucket: KYC_DOCUMENT_BUCKET,
        file,
        folder: userId,
        isPublic: false
      })
    )
  );
  return uploads;
}

export async function resolvePrivateStorageUrl(ref: string) {
  if (!ref.startsWith("storage://")) return ref;

  const [, bucket, ...pathParts] = ref.replace("storage://", "").split("/");
  const path = pathParts.join("/");
  if (!bucket || !path) return ref;

  const supabase = createAdminClient();
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 30);
  return data?.signedUrl || ref;
}
