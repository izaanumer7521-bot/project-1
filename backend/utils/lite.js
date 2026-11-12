// Public lists: swap a stored base64 picture for a small link to /api/img (see routes/img.js). The link changes whenever the picture changes.
export const liteImage = (kind, d) => (d && typeof d.image === 'string' && d.image.startsWith('data:') ? { ...d, image: `/api/img/${kind}/${d._id}?v=${new Date(d.updatedAt || d.createdAt || 0).getTime()}` } : d);
export const PUBLIC_CACHE = 'public, s-maxage=15, stale-while-revalidate=120';
