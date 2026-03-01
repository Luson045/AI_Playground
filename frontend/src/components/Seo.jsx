import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://adaai.co.in';
const DEFAULT_TITLE = 'ADA AI - Advertisement Agent AI';
const DEFAULT_DESCRIPTION =
  'Advertisement Agent AI helps you chat your way to products from real sellers, faster.';
const DEFAULT_IMAGE = '/icon.png';

function buildAbsoluteUrl(origin, path) {
  if (!origin) return path;
  if (!path) return origin;
  return path.startsWith('http') ? path : `${origin}${path}`;
}

export default function Seo({
  title,
  description,
  image,
  noIndex = false,
  path,
  type = 'website',
}) {
  const location = useLocation();
  const origin = SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const resolvedPath = path ?? location.pathname;
  const canonical = buildAbsoluteUrl(origin, resolvedPath);
  const metaTitle = title ? `${title} | ADA AI` : DEFAULT_TITLE;
  const metaDescription = description ?? DEFAULT_DESCRIPTION;
  const metaImage = buildAbsoluteUrl(origin, image ?? DEFAULT_IMAGE);

  return (
    <Helmet>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:site_name" content="ADA AI" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
      {noIndex ? <meta name="robots" content="noindex,nofollow" /> : null}
    </Helmet>
  );
}
