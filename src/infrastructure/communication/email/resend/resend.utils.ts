export const readResponseBody = async (response: Response): Promise<unknown> => {
  const text = await response.text();

  if (text === '') {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};
