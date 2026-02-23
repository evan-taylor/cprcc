"use client";

import { useMutation, useQuery } from "convex/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import SiteHeader from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const SUCCESS_MESSAGE_DURATION = 3000;
const HEIC_EXTENSION_PATTERN = /\.heic$/i;

interface UploadFile {
  error?: string;
  file: File;
  id: string;
  preview: string;
}

interface GalleryPhoto {
  _id: Id<"photos">;
  caption?: string;
  uploadedAt: number;
  uploaderName: string;
  url: string | null;
}

export default function GalleryPage() {
  useEffect(() => {
    document.title = "Photo Gallery | Cal Poly Red Cross Club";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Browse photos from Cal Poly Red Cross Club events and activities. See our volunteers in action at blood drives, community service events, and disaster relief training."
      );
    }
  }, []);

  const photos = useQuery(api.photos.listPhotos);
  const currentUser = useQuery(api.users.getCurrentUser);
  const generateUploadUrl = useMutation(api.photos.generateUploadUrl);
  const savePhoto = useMutation(api.photos.savePhoto);
  const deletePhoto = useMutation(api.photos.deletePhoto);

  const [selectedImages, setSelectedImages] = useState<UploadFile[]>([]);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const imageInput = useRef<HTMLInputElement>(null);

  const convertHeicToJpeg = async (file: File): Promise<File> => {
    try {
      const heic2any = (await import("heic2any")).default;
      const jpegBlob = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.9,
      });
      const blob = Array.isArray(jpegBlob) ? jpegBlob[0] : jpegBlob;
      return new File(
        [blob],
        file.name.replace(HEIC_EXTENSION_PATTERN, ".jpg"),
        { type: "image/jpeg" }
      );
    } catch (error) {
      throw new Error(
        `Failed to convert HEIC file: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const processFile = async (file: File): Promise<UploadFile> => {
    let processedFile = file;
    let error: string | undefined;

    const isHeic =
      file.type === "image/heic" ||
      file.type === "image/heif" ||
      file.name.toLowerCase().endsWith(".heic") ||
      file.name.toLowerCase().endsWith(".heif");

    if (isHeic) {
      try {
        processedFile = await convertHeicToJpeg(file);
      } catch (err) {
        error =
          err instanceof Error ? err.message : "Failed to convert HEIC file";
      }
    } else if (!file.type.startsWith("image/")) {
      error = "Not an image file";
    }

    if (!error && processedFile.size > MAX_FILE_SIZE) {
      error = "File too large (max 20MB)";
    }

    return {
      file: processedFile,
      id: `${file.name}-${file.size}-${file.lastModified}`,
      preview: URL.createObjectURL(processedFile),
      error,
    };
  };

  const handleImageSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      return;
    }

    for (const img of selectedImages) {
      URL.revokeObjectURL(img.preview);
    }

    setUploadError(null);
    const uploadFiles: UploadFile[] = [];

    for (const file of files) {
      uploadFiles.push(await processFile(file));
    }

    setSelectedImages(uploadFiles);
  };

  const uploadSingleImage = async (file: File): Promise<boolean> => {
    const postUrl = await generateUploadUrl();
    const result = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });

    if (!result.ok) {
      throw new Error("Failed to upload image");
    }

    const { storageId } = await result.json();
    await savePhoto({
      storageId: storageId as Id<"_storage">,
      caption: caption.trim() || undefined,
    });
    return true;
  };

  const resetUploadForm = () => {
    for (const img of selectedImages) {
      URL.revokeObjectURL(img.preview);
    }
    setSelectedImages([]);
    setCaption("");
    setUploadProgress("");
    if (imageInput.current) {
      imageInput.current.value = "";
    }
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    const validImages = selectedImages.filter((img) => !img.error);
    if (validImages.length === 0) {
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      let successCount = 0;
      let failCount = 0;

      for (const [i, { file }] of validImages.entries()) {
        setUploadProgress(`Uploading ${i + 1} of ${validImages.length}\u2026`);
        try {
          await uploadSingleImage(file);
          successCount++;
        } catch {
          failCount++;
        }
      }

      resetUploadForm();

      if (successCount > 0) {
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), SUCCESS_MESSAGE_DURATION);
      }

      if (failCount > 0) {
        setUploadError(
          `${successCount} uploaded successfully, ${failCount} failed`
        );
      }
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload photos"
      );
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<Id<"photos"> | null>(
    null
  );

  const handleDelete = async (photoId: Id<"photos">) => {
    setDeletingPhotoId(photoId);
    setDeleteError(null);

    try {
      await deletePhoto({ photoId });
      setDeletingPhotoId(null);
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete photo"
      );
      setDeletingPhotoId(null);
    }
  };

  const validImageCount = selectedImages.filter((img) => !img.error).length;

  return (
    <div className="min-h-screen bg-[color:var(--color-bg)] text-[color:var(--color-text)]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 pt-28 pb-24 sm:px-6 lg:px-8">
        <header className="mb-14 max-w-2xl">
          <p className="editorial-kicker animate-fade-up">Photo Gallery</p>
          <h1 className="stagger-1 editorial-title mt-3 animate-fade-up">
            Our volunteers in action
          </h1>
          <p className="stagger-2 editorial-lead mt-4 animate-fade-up">
            Browse photos from our events and see the impact we&apos;re making
            in the community.
          </p>
        </header>

        {currentUser?.role === "board" && (
          <div className="stagger-3 editorial-card-soft mb-12 animate-fade-up rounded-2xl p-6 sm:p-8">
            <h2 className="mb-5 font-display font-semibold text-[color:var(--color-text-emphasis)] text-lg">
              Upload Photos
            </h2>
            <form className="space-y-5" onSubmit={handleUpload}>
              <div>
                <label
                  className="mb-2 block font-medium text-[color:var(--color-text)] text-sm"
                  htmlFor="photo-upload"
                >
                  Select Images
                </label>
                <input
                  accept="image/*,.heic,.heif"
                  className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-red-50 file:px-4 file:py-2 file:font-semibold file:text-red-700 file:text-sm hover:file:bg-red-100 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  disabled={uploading}
                  id="photo-upload"
                  multiple
                  onChange={handleImageSelect}
                  ref={imageInput}
                  type="file"
                />
              </div>

              {selectedImages.length > 0 && (
                <div className="space-y-3">
                  <p className="font-medium text-slate-600 text-sm">
                    Selected: {selectedImages.length} file
                    {selectedImages.length !== 1 ? "s" : ""}
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {selectedImages.map((img) => (
                      <div
                        className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                        key={img.id}
                      >
                        <Image
                          alt={`Preview of ${img.file.name}`}
                          className="h-full w-full object-cover"
                          height={200}
                          src={img.preview}
                          unoptimized
                          width={200}
                        />
                        {img.error && (
                          <div className="absolute inset-0 flex items-center justify-center bg-red-600/80 p-2 text-center text-white text-xs">
                            {img.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label
                  className="mb-2 block font-medium text-[color:var(--color-text)] text-sm"
                  htmlFor="caption"
                >
                  Caption (optional)
                </label>
                <input
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 text-sm placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  disabled={uploading}
                  id="caption"
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption for these photos…"
                  type="text"
                  value={caption}
                />
              </div>

              {uploadError && (
                <div className="animate-scale-in rounded-xl border border-red-200 bg-red-50 p-3.5 text-red-700 text-sm">
                  {uploadError}
                </div>
              )}

              {uploadSuccess && (
                <div className="animate-scale-in rounded-xl border border-green-200 bg-green-50 p-3.5 text-green-700 text-sm">
                  Photos uploaded successfully!
                </div>
              )}

              {uploadProgress && (
                <div className="animate-scale-in rounded-xl border border-blue-200 bg-blue-50 p-3.5 text-blue-700 text-sm">
                  {uploadProgress}
                </div>
              )}

              <Button
                disabled={validImageCount === 0 || uploading}
                size="lg"
                type="submit"
              >
                {uploading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Uploading…
                  </>
                ) : (
                  `Upload ${validImageCount} Photo${validImageCount !== 1 ? "s" : ""}`
                )}
              </Button>
            </form>
          </div>
        )}

        {photos === undefined && (
          <div className="grid gap-5 sm:columns-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                className="animate-pulse overflow-hidden rounded-2xl border border-slate-100 bg-slate-50"
                key={`photo-skeleton-${i.toString()}`}
              >
                <div className="aspect-[4/3] bg-slate-100" />
                <div className="p-4">
                  <div className="mb-2 h-4 w-3/4 rounded bg-slate-100" />
                  <div className="h-3 w-1/2 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {photos !== undefined && photos.length === 0 && (
          <div className="mx-auto max-w-md py-16 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <svg
                className="h-8 w-8 text-slate-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <title>Photo gallery icon</title>
                <path
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="font-display font-semibold text-[color:var(--color-text-emphasis)] text-xl">
              No photos yet
            </h2>
            <p className="mt-2 text-[color:var(--color-text-muted)]">
              Check back soon for photos from our events and activities.
            </p>
          </div>
        )}

        {photos !== undefined && photos.length > 0 && (
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
            {photos.map((photo: GalleryPhoto) => (
              <div className="mb-5 break-inside-avoid" key={photo._id}>
                <article className="group editorial-card overflow-hidden rounded-2xl transition-all duration-200 hover:shadow-lg">
                  <div className="relative overflow-hidden bg-slate-100">
                    {photo.url && (
                      <Image
                        alt={photo.caption || "Event scene"}
                        className="h-auto w-full object-cover transition-transform duration-300 will-change-transform group-hover:scale-[1.03]"
                        height={600}
                        src={photo.url}
                        style={{
                          transitionTimingFunction:
                            "cubic-bezier(0.23, 1, 0.32, 1)",
                        }}
                        unoptimized
                        width={800}
                      />
                    )}
                  </div>
                  <div className="p-4">
                    {photo.caption && (
                      <p className="mb-2 text-slate-700 text-sm leading-relaxed">
                        {photo.caption}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-slate-400 text-xs">
                      <span>By {photo.uploaderName}</span>
                      <span>
                        {new Date(photo.uploadedAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )}
                      </span>
                    </div>
                    {currentUser?.role === "board" && (
                      <div className="mt-3 border-slate-100 border-t pt-3">
                        {deleteError && deletingPhotoId === photo._id && (
                          <p className="mb-2 text-red-600 text-xs">
                            {deleteError}
                          </p>
                        )}
                        <Button
                          className="w-full"
                          disabled={deletingPhotoId === photo._id}
                          onClick={() => handleDelete(photo._id)}
                          size="sm"
                          variant="destructive"
                        >
                          {deletingPhotoId === photo._id
                            ? "Deleting\u2026"
                            : "Delete Photo"}
                        </Button>
                      </div>
                    )}
                  </div>
                </article>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
