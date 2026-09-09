export const decodeBase64Json = (payload) => {
  if (
    !payload ||
    typeof payload !== "object" ||
    typeof payload.d !== "string"
  ) {
    return payload;
  }

  const binary = atob(payload.d);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const json = new TextDecoder("utf-8").decode(bytes);
  return JSON.parse(json);
};
