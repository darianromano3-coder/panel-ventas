let editingId = null;
let cache = [];
let serviciosCache = [];

// 🔥 NUEVO
let renovarId = null;

/* ================= MODAL ================= */

function openModal() {
  clearForm();
  editingId = null;
  document.getElementById("modal").style.display = "block";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

/* ================= LIMPIAR ================= */

function clearForm() {
  [
    "nombre","apellido","celular","servicio",
    "correo","password","pin_perfil","nombre_perfil",
    "proveedor","costo","venta","vencimiento"
  ].forEach(id => {
    let el = document.getElementById(id);
    if (el) el.value = "";
  });

  let s = document.getElementById("servicioSelect");
  let p = document.getElementById("proveedorSelect");

  if (s) s.value = "";
  if (p) p.innerHTML = `<option value="">Seleccionar proveedor</option>`;
}

/* ================= SERVICIOS ================= */

async function loadServicios() {

  const { data, error } = await client
    .from("servicios")
    .select("*");

  if (error) {
    console.log(error);
    return;
  }

  serviciosCache = data;

  let serviciosUnicos = [...new Set(data.map(s => s.nombre))];

  let select = document.getElementById("servicioSelect");

  if (!select) return;

  select.innerHTML = `<option value="">Seleccionar servicio</option>`;

  serviciosUnicos.forEach(nombre => {
    select.innerHTML += `<option value="${nombre}">${nombre}</option>`;
  });
}

/* ================= EVENTOS SELECT ================= */

document.addEventListener("change", function(e){

  if(e.target.id === "servicioSelect"){

    let servicioElegido = e.target.value;

    let proveedores = serviciosCache.filter(s => s.nombre === servicioElegido);

    let selectProv = document.getElementById("proveedorSelect");

    selectProv.innerHTML = `<option value="">Seleccionar proveedor</option>`;

    proveedores.forEach(p => {
      selectProv.innerHTML += `
        <option value="${p.id}">
          ${p.proveedor} ($${p.costo})
        </option>
      `;
    });

    servicio.value = servicioElegido;
  }

  if(e.target.id === "proveedorSelect"){

    let id = e.target.value;

    let s = serviciosCache.find(x => x.id == id);

    if (!s) return;

    proveedor.value = s.proveedor;
    costo.value = s.costo;
    venta.value = s.venta;
  }

});

/* ================= GUARDAR ================= */

async function save() {

  const payload = {
    nombre: nombre.value,
    apellido: apellido.value,
    celular: celular.value,
    servicio: servicio.value,
    correo: correo.value,
    password: password.value,
    pin_perfil: pin_perfil.value,
    nombre_perfil: nombre_perfil.value,
    proveedor: proveedor.value,
    costo: Number(costo.value || 0),
    venta: Number(venta.value || 0),
    vencimiento: vencimiento.value
  };

  let query;

  if (editingId) {
    query = client.from("clientes").update(payload).eq("id", editingId);
  } else {
    payload.codigo = Math.floor(100 + Math.random() * 900);
    query = client.from("clientes").insert([payload]);
  }

  const { error } = await query;

  if (error) {
    console.error(error);
    alert("Error guardando cliente");
    return;
  }

  closeModal();
  load();
}

/* ================= LOAD ================= */

async function load() {
  const { data } = await client.from("clientes").select("*");
  cache = data;
  render(data);
}

/* ================= ESTADO ================= */

function getEstado(vencimiento) {

  if (!vencimiento) return "";

  let [y,m,d] = vencimiento.split("-").map(Number);
  let v = new Date(y, m-1, d);

  let hoy = new Date();
  hoy.setHours(0,0,0,0);

  let diff = (v - hoy) / (1000*60*60*24);

  if (diff < 0) return "vencido";
  if (diff === 0) return "hoy";
  if (diff <= 3) return "proximo";

  return "ok";
}

/* ================= RENDER ================= */

function render(data) {

  let html = "";

  data.forEach(c => {

    let estado = getEstado(c.vencimiento);

    let color = "";
    if (estado === "vencido") color = "color:#f87171;";
    if (estado === "proximo") color = "color:#facc15;";
    if (estado === "hoy") color = "color:#4ade80;";

    html += `
    <tr>

      <td>
        <b>${c.nombre} ${c.apellido}</b><br>
        <small>${c.celular || ""}</small>
      </td>

      <td>${c.servicio || "-"}</td>

      <td>
        ${c.correo || "-"}<br>

        <span id="pass-${c.id}" style="display:none;">
          ${c.password || ""}
        </span>

        <button onclick="togglePass('${c.id}')">👁</button>
      </td>

      <td>
        ${c.nombre_perfil || "-"}<br>
        <small>PIN: ${c.pin_perfil || "-"}</small>
      </td>

      <td style="${color}">
        ${c.vencimiento || "-"}
      </td>

      <td>${c.proveedor || "-"}</td>

      <td style="display:flex; gap:5px; flex-wrap:wrap;">

        <button onclick="wa('${c.celular}','${c.nombre}','${c.servicio}','${c.vencimiento}')">🔔</button>
        
        <button onclick="waDatos('${c.id}')">📲</button>
        
        
        <!-- 🔥 NUEVO BOTON -->
        <button onclick="edit('${c.id}')">✏️</button>

        <button onclick="openRenovar('${c.id}')">💰</button>  

        <button onclick="copyDatos('${c.id}')">
          📋
        </button>

        <button onclick="del('${c.id}')">
          ❌
        </button>

      </td>

    </tr>
    `;
  });

  document.querySelector("#tabla tbody").innerHTML = html;
}

/* ================= RENOVAR ================= */

function openRenovar(id){

  renovarId = id;

  let c = cache.find(x => x.id == id);

  if(c && c.vencimiento){
    document.getElementById("renovarFecha").value = c.vencimiento;
  }

  document.getElementById("modalRenovar").style.display = "block";
}

function cerrarRenovar(){
  document.getElementById("modalRenovar").style.display = "none";
}

async function confirmarRenovacion(){

  let nuevaFecha = document.getElementById("renovarFecha").value;

  if(!nuevaFecha){
    alert("Selecciona fecha");
    return;
  }

  let c = cache.find(x => x.id == renovarId);
  if (!c) return;

  // actualizar vencimiento
  const { error } = await client
    .from("clientes")
    .update({ vencimiento: nuevaFecha })
    .eq("id", renovarId);

  if(error){
    console.log(error);
    alert("Error renovando");
    return;
  }

  // 🔥 REGISTRAR GANANCIA
  let ganancia = (Number(c.venta) || 0) - (Number(c.costo) || 0);

  await client.from("ingresos").insert([{
    cliente_id: c.id,
    nombre: c.nombre + " " + c.apellido,
    servicio: c.servicio,
    monto: ganancia
  }]);

  alert("Renovación registrada 💰");

  cerrarRenovar();
  load();
}

/* ================= RESTO ================= */

function togglePass(id) {
  let el = document.getElementById("pass-" + id);
  if (!el) return;
  el.style.display = el.style.display === "none" ? "inline" : "none";
}

function wa(t,n,s,v){
  window.open(`https://wa.me/${t}?text=${encodeURIComponent(
`Hola👋 *${n},* tu servicio *${s}💥* vence el ${v}. *Queres renovarlo?*`
  )}`);
}

function waDatos(id) {

  let c = cache.find(x => x.id == id);
  if (!c) return;

  let texto = `
Datos de tu cuenta:

Servicio: ${c.servicio}
Correo: ${c.correo}
Contraseña: ${c.password}
Perfil: ${c.nombre_perfil}
PIN: ${c.pin_perfil}
`;

  window.open(`https://wa.me/${c.celular}?text=${encodeURIComponent(texto)}`);
}

function copyDatos(id){

  let c = cache.find(x => x.id == id);
  if (!c) return;

  let texto = `
Servicio: ${c.servicio}
Correo: ${c.correo}
Contraseña: ${c.password}
Perfil: ${c.nombre_perfil}
PIN: ${c.pin_perfil}
`;

  navigator.clipboard.writeText(texto);
  alert("Datos copiados");
}

async function edit(id) {

  const { data } = await client
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single();

  editingId = id;

  Object.keys(data).forEach(k => {
    let el = document.getElementById(k);
    if (el) el.value = data[k];
  });

  document.getElementById("modal").style.display = "block";
}

async function del(id) {
  await client.from("clientes").delete().eq("id", id);
  load();
}

function search(q) {

  q = q.toLowerCase();

  let filtered = cache.filter(c =>
    (c.nombre || "").toLowerCase().includes(q) ||
    (c.apellido || "").toLowerCase().includes(q) ||
    (c.servicio || "").toLowerCase().includes(q) ||
    (c.correo || "").toLowerCase().includes(q)
  );

  render(filtered);
}

/* INIT */
window.onload = () => {
  load();
  loadServicios();

  const params = new URLSearchParams(window.location.search);

  if (params.get("new") === "true") {
    openModal();
  }
};