import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

export type PreparedImage = {
  uri: string;
  mimeType: string;
};

function normalizeUri(input: string): string {
  const value = input.trim();
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value)) return value;
  return `file://${value}`;
}

function preferredFormat(uri: string): { format: SaveFormat; mimeType: string } {
  const clean = uri.split("?")[0].toLowerCase();
  if (clean.endsWith(".png")) return { format: SaveFormat.PNG, mimeType: "image/png" };
  return { format: SaveFormat.JPEG, mimeType: "image/jpeg" };
}

export async function prepareShareableImage(sourceUri: string): Promise<PreparedImage> {
  const normalized = normalizeUri(sourceUri);
  const { format, mimeType } = preferredFormat(normalized);

  // Re-encode the source into a concrete cache file so share/save always gets a real image file.
  const result = await manipulateAsync(normalized, [], {
    format,
    compress: format === SaveFormat.PNG ? 1 : 0.92,
  });

  if (!result.uri) {
    throw new Error("Image export failed.");
  }

  return {
    uri: result.uri,
    mimeType,
  };
}
