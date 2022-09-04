export const uint8ToBase64 = (buffer: Uint8Array) => {
  const output: string[] = [];
  buffer.forEach((item) => {
    output.push(String.fromCharCode(item));
  });
  return btoa(output.join(''));
};

export const uint8ToHexString = (buffer: Uint8Array) => {
  return buffer.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
};
