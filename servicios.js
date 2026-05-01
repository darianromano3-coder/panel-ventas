let cacheServicios = [];
let editingServicio = null;

/* ================= LOAD ================= */

async function loadServices() {

  const { data, error } = await client
    .from("servicios")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.log(error);
    return;
  }

  cacheServicios = data;

  renderServicios(data);
}

/* ================= RENDER ================= */

function renderServicios(data) {

  let html = "";

  data.forEach(s => {

    html += `
    <tr>
      <td>${s.nombre}</td>
      <td>$${s.costo}</td>
      <td>$${s.venta}</td>
      <td>${s.proveedor}</td>

      <td>
        <button onclick="editServicio('${s.id}')">Editar</button>
        <button onclick="deleteServicio('${s.id}')">❌</button>
      </td>
    </tr>
    `;
  });

  document.querySelector("#tabla tbody").innerHTML = html;
}

/* ================= ADD / UPDATE ================= */

async function addService() {

  const payload = {
    nombre: nombre.value,
    costo: Number(costo.value || 0),
    venta: Number(venta.value || 0),
    proveedor: proveedor.value
  };

  let error;

  if (editingServicio) {

    const res = await client
      .from("servicios")
      .update(payload)
      .eq("id", editingServicio);

    error = res.error;
    editingServicio = null;

  } else {

    const res = await client
      .from("servicios")
      .insert([payload]);

    error = res.error;
  }

  if (error) {
    console.log(error);
    alert("Error al guardar servicio");
    return;
  }

  // limpiar inputs
  nombre.value = "";
  costo.value = "";
  venta.value = "";
  proveedor.value = "";

  loadServices();
}

/* ================= EDIT ================= */

async function editServicio(id) {

  const { data } = await client
    .from("servicios")
    .select("*")
    .eq("id", id)
    .single();

  editingServicio = id;

  nombre.value = data.nombre;
  costo.value = data.costo;
  venta.value = data.venta;
  proveedor.value = data.proveedor;
}

/* ================= DELETE ================= */

async function deleteServicio(id) {
  await client.from("servicios").delete().eq("id", id);
  loadServices();
}

/* ================= SEARCH ================= */

function searchServicios(q) {

  q = q.toLowerCase();

  let filtrados = cacheServicios.filter(s =>
    (s.nombre || "").toLowerCase().includes(q) ||
    (s.proveedor || "").toLowerCase().includes(q)
  );

  renderServicios(filtrados);
}

/* ================= INIT ================= */

loadServices();