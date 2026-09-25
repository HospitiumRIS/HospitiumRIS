/**
 * Strip path separators and unsafe characters from a client-supplied file name.
 * Does not include directory components — callers must never use raw file.name in paths.
 */
export function sanitizeFileName(fileName = 'upload') {
  const base = String(fileName).split(/[/\\]/).pop() || 'upload';
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '_') || 'upload';
}
