module.exports = (items) =>
  items.map((item) => {
    return Object.keys(item).reduce((prev, curr) => {
      prev[curr] = Object.values(item[curr])[0];
      return prev;
    }, {});
  });
