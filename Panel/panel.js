const supabaseUrl = "https://kgwjjngjljmjewhlimex.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd2pqbmdqbGptamV3aGxpbWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1Njk4NTksImV4cCI6MjA5MzE0NTg1OX0.Qkxzddp4WG_pgbVaR24YvF9lVnejHLCDFGolGmyGvVQ";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

//====================v1====================
// ================= CACHE =================
let listaServicios = [];
let listaProductos = [];
let filtroActual = "";
let mostrarCompletados = false;

// ================= VISTAS =================
function cargarVista(v){
  if(v==="dashboard") dashboard();
  if(v==="productos") productos();
  if(v==="pedidos") pedidos();
  if(v==="cuentas") cuentas();
  if(v==="servicios") servicios();
  if(v==="proveedores") proveedores();
  if(v==="ganancias") ganancias();
}

// ================= DASHBOARD =================
async function dashboard(){
  let { data } = await supabaseClient.from("pedidos").select("*");

  let total = 0;
  data.forEach(p=> total += Number(p.total));

  document.getElementById("contenido").innerHTML = `
    <div class="card">
      <h1>📊 Dashboard</h1>
      <p>Total generado: $${total}</p>
    </div>
  `;
}

// ================= SERVICIOS =================
async function servicios(){

  let { data } = await supabaseClient.from("servicios").select("*");
  listaServicios = data || [];

  let html = `
    <h1>🎬 Servicios</h1>

    <input id="serv_nombre" placeholder="Nombre">
    <input id="serv_img" placeholder="URL imagen">
    <button onclick="crearServicio()">Crear</button>
  `;

  data.forEach(s=>{
    html += `
      <div class="card">
        ${s.imagen_url ? `<img src="${s.imagen_url}" class="card-img">` : ""}
        <h3>${s.nombre}</h3>
        <button onclick="eliminarServicio('${s.id}')">Eliminar</button>
      </div>
    `;
  });

  document.getElementById("contenido").innerHTML = html;
}

async function crearServicio(){
  await supabaseClient.from("servicios").insert([{
    nombre: serv_nombre.value,
    imagen_url: serv_img.value
  }]);
  servicios();
}

async function eliminarServicio(id){
  await supabaseClient.from("servicios").delete().eq("id",id);
  servicios();
}

// ================= AUTOCOMPLETAR =================
window.autocompletarServicio = function(nombreInputId, imgInputId){

  let nombre = document.getElementById(nombreInputId).value.toLowerCase();
  let imgInput = document.getElementById(imgInputId);

  if(!nombre || !imgInput) return;

  let servicio = listaServicios.find(s =>
    s.nombre.toLowerCase() === nombre
  );

  if(servicio){
    imgInput.value = servicio.imagen_url || "";
  } else {
    imgInput.value = "";
  }
};

// ================= PRODUCTOS =================
async function productos(){
  let { data } = await supabaseClient.from("productos").select("*");
  listaProductos = data || [];
  renderProductos();
}

function renderProductos(){

  let filtrados = listaProductos.filter(p =>
    p.nombre.toLowerCase().includes(filtroActual.toLowerCase())
  );

  let html = `
    <h1>🛍 Productos</h1>
    <input id="buscador" placeholder="Buscar..." value="${filtroActual}">
    <button onclick="modalCrear()">➕ Nuevo</button>
    <div class="grid">
  `;

  filtrados.forEach(p=>{
    html += `
      <div class="card">
        ${p.imagen_url ? `<img src="${p.imagen_url}" class="card-img">` : ""}
        <h3>${p.nombre}</h3>
        <p>${p.descripcion || ""}</p>
        <p>$${p.precio}</p>

        <button onclick="modalEditar('${p.id}')">Editar</button>
        <button onclick="eliminarProducto('${p.id}')">Eliminar</button>
      </div>
    `;
  });

  html += "</div>";
  document.getElementById("contenido").innerHTML = html;

  let input = document.getElementById("buscador");
  if(input){
    input.oninput = (e)=>{
      filtroActual = e.target.value;
      renderProductos();
    };
  }
}

// ================= PEDIDOS =================
async function pedidos(){

  let { data } = await supabaseClient
    .from("pedidos")
    .select("*")
    .order("fecha",{ascending:false});

  let html = `
    <h1>📦 Pedidos</h1>

    <button onclick="togglePedidos()">
      ${mostrarCompletados ? "Ocultar" : "Ver"} completados
    </button>
  `;

  for(let p of data){

    if(p.estado === "completado" && !mostrarCompletados) continue;

    html += `
      <div class="card">
        <h3>${p.ticket}</h3>
        <p>${p.nombre}</p>
        <p>Total: $${p.total}</p>
      </div>
    `;
  }

  document.getElementById("contenido").innerHTML = html;
}

window.togglePedidos = function(){
  mostrarCompletados = !mostrarCompletados;
  pedidos();
};

// ================= CUENTAS =================
async function cuentas(){
  let { data } = await supabaseClient.from("cuentas_activas").select("*");

  let html="";
  data.forEach(c=>{
    let dias = Math.ceil((new Date(c.vence)-new Date())/(1000*60*60*24));
    html+=`<div class="card"><h3>${c.cliente}</h3><p>${c.servicio}</p><p>${dias} días</p></div>`;
  });

  document.getElementById("contenido").innerHTML = html;
}

// ================= PROVEEDORES (RESTO COMPLETO) =================
async function proveedores(){

  let { data } = await supabaseClient.from("proveedores").select("*");

  let html = `
    <h1>🏢 Proveedores</h1>

    <input id="prov_nombre" placeholder="Nombre proveedor">
    <button onclick="crearProveedor()">Crear</button>
  `;

  data.forEach(p=>{
    html += `
      <div class="card">
        ${p.nombre}
        <button onclick="eliminarProveedor('${p.id}')">Eliminar</button>
      </div>
    `;
  });

  document.getElementById("contenido").innerHTML = html;
}

window.crearProveedor = async function(){

  let input = document.getElementById("prov_nombre");
  if(!input.value) return;

  await supabaseClient.from("proveedores").insert([{
    nombre: input.value
  }]);

  proveedores();
};

window.eliminarProveedor = async function(id){

  if(!confirm("¿Eliminar proveedor?")) return;

  await supabaseClient
    .from("proveedores")
    .delete()
    .eq("id", id);

  proveedores();
};

// ================= GANANCIAS =================
async function ganancias(){

  let { data } = await supabaseClient.from("productos").select("*");

  let total=0;
  let html="";

  data.forEach(p=>{
    let g=p.precio-(p.costo||0);
    total+=g;
    html+=`<div class="card">${p.nombre} → $${g}</div>`;
  });

  document.getElementById("contenido").innerHTML = `
    <h1>💰 Ganancias</h1>
    <div class="card"><h2>Total: $${total}</h2></div>
    ${html}
  `;
}

// ================= MODALES =================
window.modalCrear = function(){

  let opciones = listaServicios.map(s =>
    `<option value="${s.nombre}"></option>`
  ).join("");

  cerrarModal();

  document.body.insertAdjacentHTML("beforeend", `
    <div class="modal" id="modal">
      <div class="modal-box">

        <h3>➕ Crear Producto</h3>

        <label>Servicio</label>
        <input list="serviciosList" id="n_nombre"
        oninput="autocompletarServicio('n_nombre','n_img')">
        <datalist id="serviciosList">${opciones}</datalist>

        <label>Imagen</label>
        <input id="n_img">

        <label>Descripción</label>
        <input id="n_desc">

        <label>Precio</label>
        <input id="n_precio" type="number">

        <label>Costo</label>
        <input id="n_costo" type="number">

        <label>Tipo</label>
        <select id="n_tipo" onchange="togglePantallas()">
          <option value="pantalla">Pantalla</option>
          <option value="completa">Completa</option>
        </select>

        <div id="pantallasBox">
          <label>Máx pantallas</label>
          <input id="n_pantallas" type="number">
        </div>

        <button onclick="crearProducto()">Guardar</button>
        <button onclick="cerrarModal()">Cancelar</button>

      </div>
    </div>
  `);

  togglePantallas();
};

window.modalEditar = async function(id){

  let { data } = await supabaseClient
    .from("productos")
    .select("*")
    .eq("id",id)
    .single();

  cerrarModal();

  document.body.insertAdjacentHTML("beforeend", `
    <div class="modal" id="modal">
      <div class="modal-box">

        <h3>✏️ Editar Producto</h3>

        <input id="e_nombre" value="${data.nombre}">
        <input id="e_img" value="${data.imagen_url || ""}">
        <input id="e_desc" value="${data.descripcion || ""}">
        <input id="e_precio" value="${data.precio}">
        <input id="e_costo" value="${data.costo || 0}">

        <button onclick="guardarEdit('${id}')">Guardar</button>
        <button onclick="cerrarModal()">Cancelar</button>

      </div>
    </div>
  `);
};

// ================= CREAR PRODUCTO =================
window.crearProducto = async function(){

  await supabaseClient.from("productos").insert([{
    nombre: n_nombre.value,
    imagen_url: n_img.value,
    descripcion: n_desc.value,
    precio: Number(n_precio.value),
    costo: Number(n_costo.value),
    tipo: n_tipo.value,
    max_pantallas: Number(n_pantallas.value || 0)
  }]);

  cerrarModal();
  productos();
};

// ================= EDITAR PRODUCTO =================
window.guardarEdit = async function(id){

  await supabaseClient.from("productos")
    .update({
      nombre: e_nombre.value,
      imagen_url: e_img.value,
      descripcion: e_desc.value,
      precio: Number(e_precio.value),
      costo: Number(e_costo.value)
    })
    .eq("id",id);

  cerrarModal();
  productos();
};

// ================= PANTALLAS =================
window.togglePantallas = function(){

  let tipo =
    document.getElementById("n_tipo") ||
    document.getElementById("e_tipo");

  let box = document.getElementById("pantallasBox");

  if(!tipo || !box) return;

  box.style.display = tipo.value === "completa" ? "none" : "block";
};

// ================= CERRAR MODAL =================
window.cerrarModal = function(){
  let m = document.getElementById("modal");
  if(m) m.remove();
};
