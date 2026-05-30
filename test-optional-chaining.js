const obj = {};
try {
  console.log(obj.a?.b.length);
} catch (e) {
  console.log(e.name, e.message);
}
