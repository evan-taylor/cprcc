"use client";

import { useMutation, useQuery } from "convex/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import SiteHeader from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const SUCCESS_MESSAGE_DURATION = 3000;

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

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setUploadError("Please select an image file");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setUploadError("Image must be smaller than 20MB");
        return;
      }
      setSelectedImage(file);
      setUploadError(null);
    }
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedImage) {
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const postUrl = await generateUploadUrl();

      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": selectedImage.type },
        body: selectedImage,
      });

      if (!result.ok) {
        throw new Error("Failed to upload image");
      }

      const { storageId } = await result.json();

      await savePhoto({
        storageId: storageId as Id<"_storage">,
        caption: caption.trim() || undefined,
      });

      setSelectedImage(null);
      setCaption("");
      setUploadSuccess(true);
      if (imageInput.current) {
        imageInput.current.value = "";
      }

      setTimeout(() => setUploadSuccess(false), SUCCESS_MESSAGE_DURATION);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload photo"
      );
    } finally {
      setUploading(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 pt-24 pb-20 sm:px-6 lg:px-8">
        <header className="mb-12 space-y-4">
          <p className="font-display font-semibold text-red-600 text-sm uppercase tracking-wider">
            Photo Gallery
          </p>
          <h1 className="font-bold font-display text-4xl text-slate-900 tracking-tight sm:text-5xl">
            Our volunteers in action
          </h1>
          <p className="max-w-2xl text-lg text-slate-900 leading-relaxed">
            Browse photos from our events and see the impact we&apos;re making
            in the community.
          </p>
        </header>

        {currentUser?.role === "board" && (
          <Card className="mb-12 border-2 border-red-100 bg-red-50/30">
            <CardContent className="p-6">
              <h2 className="mb-4 font-display font-semibold text-slate-900 text-xl">
                Upload Photo
              </h2>
              <form className="space-y-4" onSubmit={handleUpload}>
                <div>
                  <label
                    className="mb-2 block font-medium text-slate-900 text-sm"
                    htmlFor="photo-upload"
                  >
                    Select Image
                  </label>
                  <input
                    accept="image/*"
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-red-50 file:px-4 file:py-2 file:font-semibold file:text-red-700 file:text-sm hover:file:bg-red-100 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                    disabled={uploading}
                    id="photo-upload"
                    onChange={handleImageSelect}
                    ref={imageInput}
                    type="file"
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block font-medium text-slate-900 text-sm"
                    htmlFor="caption"
                  >
                    Caption (optional)
                  </label>
                  <input
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 text-sm placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                    disabled={uploading}
                    id="caption"
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption for this photo..."
                    type="text"
                    value={caption}
                  />
                </div>

                {uploadError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 text-sm">
                    {uploadError}
                  </div>
                )}

                {uploadSuccess && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-green-800 text-sm">
                    Photo uploaded successfully!
                  </div>
                )}

                <Button
                  disabled={!selectedImage || uploading}
                  size="lg"
                  type="submit"
                >
                  {uploading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Photo"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {photos === undefined && (
          <Card className="p-12 text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-red-600" />
              <p className="text-slate-900">Loading photos...</p>
            </div>
          </Card>
        )}

        {photos !== undefined && photos.length === 0 && (
          <Card className="border-2 border-red-200 border-dashed bg-red-50/30 p-12 text-center">
            <div className="mx-auto max-w-md space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
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
              <h2 className="font-display font-semibold text-2xl text-slate-900">
                No photos yet
              </h2>
              <p className="text-slate-900">
                Check back soon for photos from our events and activities.
              </p>
            </div>
          </Card>
        )}

        {photos !== undefined && photos.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <Card
                className="group overflow-hidden transition-all hover:shadow-lg"
                key={photo._id}
              >
                <div className="relative aspect-square overflow-hidden bg-slate-100">
                  {photo.url && (
                    <Image
                      alt={photo.caption || "Event photo"}
                      className="object-cover transition-transform group-hover:scale-105"
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      src={photo.url}
                    />
                  )}
                </div>
                <CardContent className="p-4">
                  {photo.caption && (
                    <p className="mb-2 text-slate-900 text-sm leading-relaxed">
                      {photo.caption}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-slate-900 text-xs">
                    <span>By {photo.uploaderName}</span>
                    <span>
                      {new Date(photo.uploadedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
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
                          ? "Deleting..."
                          : "Delete Photo"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
