export class SingleFlight {
  private readonly inFlight = new Map<string, Promise<unknown>>();

  async run<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);

    if (existing !== undefined) {
      return existing as Promise<T>;
    }

    const pending = loader().finally(() => {
      this.inFlight.delete(key);
    });

    this.inFlight.set(key, pending);

    return pending;
  }

  get size(): number {
    return this.inFlight.size;
  }
}
