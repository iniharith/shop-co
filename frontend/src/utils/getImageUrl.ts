/**
 * Coded by Harith
 * Kampungcetak ®
 */
export const getImageUrl = (imagePath: string) => {
  if (!imagePath) return "/placeholder.svg";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("data:")) {
    return imagePath;
  }
  if (imagePath.startsWith("/images/") || imagePath.startsWith("/placeholder")) {
    return imagePath;
  }
  // Remove leading slash to avoid double slashes
  const path = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${process.env.NEXT_PUBLIC_BACKEND_URL || ""}${path}`;
};
