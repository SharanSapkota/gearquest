import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { cache } from 'react';
import { api } from './api';

type Props = { params: Promise<{ locale: string }> };

// Page <title> from a message key ("namespace.key"); the layout's template appends the site name.
export const pageTitle =
  (path: string) =>
  async ({ params }: Props): Promise<Metadata> => {
    const { locale } = await params;
    const [namespace, ...rest] = path.split('.');
    const t = await getTranslations({ locale, namespace });
    return { title: t(rest.join('.')) };
  };

// Shared by generateMetadata and the page itself, so each request fetches once.
export const getGearCached = cache((id: string) => api.getGear(id));
export const getUserCached = cache((id: string) => api.getUser(id));
