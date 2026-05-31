// In-memory session store for the create flow.
// Persists captured media blob across client-side page navigations.
// Cleared on publish or explicit reset.

export type CreateMediaType = 'photo' | 'video' | 'text';

interface CreateSession {
  blob: Blob | null;
  objectURL: string | null;
  mediaType: CreateMediaType;
  textContent: string;
  textStyle: string;
  // Cloudinary result after upload
  cloudinaryId: string | null;
  cloudinaryURL: string | null;
  thumbnailURL: string | null;
}

const session: CreateSession = {
  blob:          null,
  objectURL:     null,
  mediaType:     'video',
  textContent:   '',
  textStyle:     'bold',
  cloudinaryId:  null,
  cloudinaryURL: null,
  thumbnailURL:  null,
};

export function setSessionMedia(blob: Blob, type: CreateMediaType): string {
  if (session.objectURL) URL.revokeObjectURL(session.objectURL);
  session.blob      = blob;
  session.objectURL = URL.createObjectURL(blob);
  session.mediaType = type;
  return session.objectURL;
}

export function setSessionText(content: string, style: string) {
  session.textContent = content;
  session.textStyle   = style;
  session.mediaType   = 'text';
}

export function setSessionCloudinary(id: string, url: string, thumbnail?: string) {
  session.cloudinaryId  = id;
  session.cloudinaryURL = url;
  session.thumbnailURL  = thumbnail ?? null;
}

export function getSession(): Readonly<CreateSession> {
  return session;
}

export function clearSession() {
  if (session.objectURL) URL.revokeObjectURL(session.objectURL);
  Object.assign(session, {
    blob: null, objectURL: null, mediaType: 'video',
    textContent: '', textStyle: 'bold',
    cloudinaryId: null, cloudinaryURL: null, thumbnailURL: null,
  });
}
