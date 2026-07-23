async function run() {
  const res = await fetch('http://localhost:5000/api/users', { headers: { 'Authorization': 'Bearer ' } });
  console.log(await res.json());
}
run();
