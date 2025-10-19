// Extract image from RSS item
function extractImageFromRSS(item) {
  let imageUrl = null;

  try {
    // Method 1: RSS enclosure
    if (
      item.enclosure &&
      item.enclosure.url &&
      (item.enclosure.type?.includes("image") ||
        item.enclosure.url.match(/\.(jpg|jpeg|png|gif|webp)$/i))
    ) {
      imageUrl = item.enclosure.url;
    }

    // Method 2: MediaRSS content
    if (
      !imageUrl &&
      item["media:content"] &&
      item["media:content"]["$"] &&
      item["media:content"]["$"].url
    ) {
      imageUrl = item["media:content"]["$"].url;
    }

    // Method 3: MediaRSS thumbnail
    if (
      !imageUrl &&
      item["media:thumbnail"] &&
      item["media:thumbnail"]["$"] &&
      item["media:thumbnail"]["$"].url
    ) {
      imageUrl = item["media:thumbnail"]["$"].url;
    }

    // Method 4: Direct image field
    if (!imageUrl && item.image) {
      if (typeof item.image === "string") {
        imageUrl = item.image;
      } else if (item.image.url) {
        imageUrl = item.image.url;
      }
    }

    // Method 5: Extract from content
    if (!imageUrl && item.content) {
      const imgMatch = item.content.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch && imgMatch[1]) {
        imageUrl = imgMatch[1];
      }
    }

    // Method 6: Extract from content:encoded
    if (!imageUrl && item["content:encoded"]) {
      const imgMatch = item["content:encoded"].match(
        /<img[^>]+src=["']([^"']+)["']/i
      );
      if (imgMatch && imgMatch[1]) {
        imageUrl = imgMatch[1];
      }
    }

    // Clean up relative URLs
    if (imageUrl) {
      if (imageUrl.startsWith("//")) {
        imageUrl = "https:" + imageUrl;
      } else if (imageUrl.startsWith("/")) {
        imageUrl = null;
      }
    }
  } catch (error) {
    console.error("Error extracting image:", error);
  }

  return imageUrl;
}

module.exports = { extractImageFromRSS };

