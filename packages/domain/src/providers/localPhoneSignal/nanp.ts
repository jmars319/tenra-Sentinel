const tollFreeAreaCodes = new Set(["800", "833", "844", "855", "866", "877", "888"]);

export type NanpParts = {
  areaCode: string;
  exchange: string;
  line: string;
};

export const isTollFreeAreaCode = (areaCode: string): boolean => tollFreeAreaCodes.has(areaCode);

export const getNanpParts = (digits: string): NanpParts | null => {
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;

  if (national.length !== 10) {
    return null;
  }

  return {
    areaCode: national.slice(0, 3),
    exchange: national.slice(3, 6),
    line: national.slice(6),
  };
};
