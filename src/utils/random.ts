const randomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const pickOneFromGroup = function <T>(group: T[]) {
  return group[randomInt(0, group.length - 1)];
};
