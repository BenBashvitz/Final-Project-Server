export const removeBaseUrl = (url: string): string => {
  return url.replace(/^.*\/\/[^/]+/, "");
};
