import { useEffect, useRef, useState } from "react";
import { clearStored, readStored, writeStored } from "./storage";

/**
 * useState that survives unmount, reload and back-navigation, scoped to one
 * store slug.
 *
 * `scope` is the store slug. While it is undefined (the slug hasn't resolved
 * yet) the hook behaves as plain useState and writes nothing — otherwise the
 * first render would persist an empty value under the wrong key. When the slug
 * arrives, or the buyer moves to a different store, state is re-hydrated from
 * that store's own entry.
 *
 * Returns the usual [value, setValue] pair plus a `clear` that wipes both the
 * stored entry and the in-memory value — call it once an order completes so
 * the next buyer on a shared device doesn't inherit the last one's details.
 */
export const usePersistedState = <T>(
  scope: string | undefined,
  name: string,
  initialValue: T,
) => {
  const [value, setValue] = useState<T>(() =>
    scope ? readStored(scope, name, initialValue) : initialValue,
  );

  // Which scope the current `value` was hydrated from. Starts at the mount
  // scope so the effect below doesn't re-read (and re-render) on first run.
  const hydratedScope = useRef<string | null>(scope ?? null);

  // Held in a ref because callers pass object literals — a fresh identity on
  // every render would otherwise retrigger the effects endlessly.
  const initialRef = useRef(initialValue);

  useEffect(() => {
    if (!scope || hydratedScope.current === scope) return;
    hydratedScope.current = scope;
    setValue(readStored(scope, name, initialRef.current));
  }, [scope, name]);

  useEffect(() => {
    // Only persist once the value genuinely belongs to this scope, so a
    // mid-flight slug change can't write store A's address under store B.
    if (!scope || hydratedScope.current !== scope) return;
    writeStored(scope, name, value);
  }, [scope, name, value]);

  const clear = () => {
    if (scope) clearStored(scope, name);
    setValue(initialRef.current);
  };

  return [value, setValue, clear] as const;
};
