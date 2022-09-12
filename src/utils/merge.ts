import merge from 'lodash/mergeWith';

const customizer = (obj: any, src: any) => {
  if (Array.isArray(obj)) {
    return obj.concat(src);
  }
};

export const mergeWith = (target: any, source: any) => {
  return merge(target, source, customizer);
};
