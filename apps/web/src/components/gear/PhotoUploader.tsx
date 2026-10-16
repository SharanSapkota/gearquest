'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { MAX_GEAR_IMAGES } from '@gearshare/shared';
import { Button, IconButton } from '@/components/ui/Button';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '@/components/ui/icons';
import { api } from '@/lib/api';
import { ResizeError, resizeImage } from '@/lib/imageResize';

type PhotoError = 'type' | 'size' | 'decode' | 'upload';
type Photo = {
  id: string;
  preview: string;
  url?: string;
  progress: number;
  error?: PhotoError;
  blob?: Blob; // kept so a failed upload can be retried without re-resizing
};

export type PhotoState = { urls: string[]; busy: boolean; hasError: boolean };

let nextId = 0;
const newId = () => `photo-${nextId++}`;

export function PhotoUploader({
  initialUrls,
  onChange,
  errorText,
}: {
  initialUrls: string[];
  onChange: (state: PhotoState) => void;
  errorText?: string;
}) {
  const t = useTranslations('gearForm.photos');
  const [photos, setPhotos] = useState<Photo[]>(() =>
    initialUrls.map((url) => ({ id: newId(), preview: url, url, progress: 1 })),
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrls = useRef(new Set<string>());

  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  useEffect(() => {
    onChange({
      urls: photos.flatMap((p) => (p.url ? [p.url] : [])),
      busy: photos.some((p) => !p.url && !p.error),
      hasError: photos.some((p) => p.error),
    });
  }, [photos, onChange]);

  const patch = (id: string, changes: Partial<Photo>) =>
    setPhotos((list) => list.map((p) => (p.id === id ? { ...p, ...changes } : p)));

  const upload = async (id: string, blob: Blob) => {
    patch(id, { blob, progress: 0, error: undefined });
    try {
      const sig = await api.signUpload();
      const url = await api.uploadImage(blob, sig, (progress) => patch(id, { progress }));
      patch(id, { url, progress: 1, blob: undefined });
    } catch {
      patch(id, { error: 'upload' });
    }
  };

  const addFiles = (files: File[]) => {
    const room = MAX_GEAR_IMAGES - photos.length;
    for (const file of files.slice(0, Math.max(room, 0))) {
      const id = newId();
      const preview = URL.createObjectURL(file);
      objectUrls.current.add(preview);
      setPhotos((list) => [...list, { id, preview, progress: 0 }]);
      resizeImage(file).then(
        (blob) => void upload(id, blob),
        (err: unknown) => patch(id, { error: err instanceof ResizeError ? err.code : 'decode' }),
      );
    }
  };

  const remove = (id: string) => setPhotos((list) => list.filter((p) => p.id !== id));
  const move = (index: number, delta: -1 | 1) =>
    setPhotos((list) => {
      const target = index + delta;
      if (target < 0 || target >= list.length) return list;
      const copy = [...list];
      const [item] = copy.splice(index, 1);
      if (item) copy.splice(target, 0, item);
      return copy;
    });

  return (
    <fieldset className="field photos">
      <legend>{t('label')}</legend>
      <small>{t('hint', { max: MAX_GEAR_IMAGES })}</small>
      {photos.length > 0 && (
        <ul className="photos__list">
          {photos.map((photo, index) => (
            <li key={photo.id} className="photos__item">
              {/* Blob/remote previews: next/image does not apply. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.preview} alt={t('previewAlt', { n: index + 1 })} />
              {index === 0 && <span className="photos__cover badge badge--primary">{t('cover')}</span>}
              {!photo.url && !photo.error && (
                <progress
                  value={photo.progress}
                  max={1}
                  aria-label={t('uploading')}
                  className="photos__progress"
                />
              )}
              {photo.error && (
                <p role="alert" className="photos__error">
                  {t(`error.${photo.error}`)}
                </p>
              )}
              <div className="photos__actions">
                <IconButton
                  label={t('moveEarlier')}
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                >
                  <ChevronLeftIcon size={18} />
                </IconButton>
                <IconButton
                  label={t('moveLater')}
                  onClick={() => move(index, 1)}
                  disabled={index === photos.length - 1}
                >
                  <ChevronRightIcon size={18} />
                </IconButton>
                {photo.error === 'upload' && photo.blob && (
                  <Button variant="outline" size="sm" onClick={() => void upload(photo.id, photo.blob as Blob)}>
                    {t('retry')}
                  </Button>
                )}
                <IconButton label={t('remove')} variant="ghost" onClick={() => remove(photo.id)}>
                  <CloseIcon size={18} />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => {
          addFiles(Array.from(e.target.files ?? []));
          e.target.value = '';
        }}
      />
      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={photos.length >= MAX_GEAR_IMAGES}
      >
        {photos.length >= MAX_GEAR_IMAGES ? t('full', { max: MAX_GEAR_IMAGES }) : t('add')}
      </Button>
      {errorText && <span role="alert">{errorText}</span>}
    </fieldset>
  );
}
