/** Effects the pure domain needs from its caller — keeps the core deterministic and IO-free. */
export type DomainDeps = {
  /** Returns an ISO timestamp. */
  now: () => string;
  /** Returns a unique id. */
  id: () => string;
};
