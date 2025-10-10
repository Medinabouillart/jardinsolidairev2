export function removePhotoFromArray(photos, indexToRemove) {
  if (indexToRemove < 0 || indexToRemove >= photos.length) {
    return photos;
  }
  return photos.filter((_, i) => i !== indexToRemove);
}