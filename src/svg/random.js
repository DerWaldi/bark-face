
let seed = 42;

export const random = () => {
  var x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export const resetSeed = (val) => seed = val;