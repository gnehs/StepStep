// Only the test bundle aliases next/headers to this in-memory cookie jar.
export const cookieValues = new Map<string, string>();
export const cookieOptions = new Map<string, Record<string, unknown>>();
export const cookieDeletes = new Set<string>();
export const cookieOperations: Array<
  | { kind: "set"; name: string; value: string; options: Record<string, unknown> }
  | { kind: "delete"; name: string }
> = [];

export function resetCookies() {
  cookieValues.clear();
  cookieOptions.clear();
  cookieDeletes.clear();
  cookieOperations.length = 0;
}

export async function cookies() {
  return {
    get: (name: string) =>
      cookieValues.has(name) ? { value: cookieValues.get(name)! } : undefined,
    set: (name: string, value: string, options: Record<string, unknown>) => {
      cookieValues.set(name, value);
      cookieOptions.set(name, options);
      cookieOperations.push({ kind: "set", name, value, options });
    },
    delete: (name: string) => {
      cookieValues.delete(name);
      cookieDeletes.add(name);
      cookieOperations.push({ kind: "delete", name });
    },
  };
}
