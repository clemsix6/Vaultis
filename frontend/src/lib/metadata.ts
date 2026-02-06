import type { WatchMetadata } from "@/types";

export function parseTokenURI(uri: string): WatchMetadata | null {
  try {
    if (uri.startsWith("data:application/json;base64,")) {
      const base64 = uri.slice("data:application/json;base64,".length);
      const json = atob(base64);
      return JSON.parse(json) as WatchMetadata;
    }
    if (uri.startsWith("data:application/json,")) {
      const encoded = uri.slice("data:application/json,".length);
      const json = decodeURIComponent(encoded);
      return JSON.parse(json) as WatchMetadata;
    }
    return null;
  } catch {
    return null;
  }
}

export function getAttributeValue(
  metadata: WatchMetadata,
  traitType: string
): string | number | undefined {
  const attr = metadata.attributes.find((a) => a.trait_type === traitType);
  return attr?.value;
}
