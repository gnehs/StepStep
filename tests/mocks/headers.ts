// Only the test bundle aliases next/headers to this in-memory cookie jar.
export const cookieValues = new Map<string, string>();
export const cookieOptions = new Map<string, Record<string, unknown>>();
export async function cookies() {
  return {
    get: (name: string) =>
      cookieValues.has(name) ? { value: cookieValues.get(name)! } : undefined,
    set: (name: string, value: string, options: Record<string, unknown>) => {
      cookieValues.set(name, value);
      cookieOptions.set(name, options);
    },
    delete: (name: string) => {
      cookieValues.delete(name);
    },
  };
}
