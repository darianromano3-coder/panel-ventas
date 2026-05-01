const supabaseUrl = "https://kgwjjngjljmjewhlimex.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd2pqbmdqbGptamV3aGxpbWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1Njk4NTksImV4cCI6MjA5MzE0NTg1OX0.Qkxzddp4WG_pgbVaR24YvF9lVnejHLCDFGolGmyGvVQ";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

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

// ================= PRODUCTOS =================
async function productos(){
  let { data } = await supabaseClient.from("productos").select("*");
  listaProductos = data || [];
  renderProductos();
}
//nueva funcion
window.autocompletarServicio = function(nombreInputId, imgInputId){

  let nombre = document.getElementById(nombreInputId).value.toLowerCase();
  let imgInput = document.getElementById(imgInputId);

  if(!nombre || !imgInput) return;

  // buscar coincidencia exacta o parcial
  let servicio = listaServicios.find(s =>
    s.nombre.toLowerCase() === nombre
  );

  if(servicio){
    imgInput.value = servicio.imagen_url || "";
  } else {
    // opcional: limpiar si no coincide
    imgInput.value = "";
  }
};
//nueva fincion
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
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

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

    let { data: items } = await supabaseClient
      .from("pedido_items")
      .select("*")
      .eq("pedido_id", p.id);

    let detalleHTML = "";

    if(items){
      items.forEach((d,i)=>{
        detalleHTML += `
          <div class="card" style="margin-top:10px; background:#111827;">
            <b>Pedido ${i+1}</b><br>
            ${d.nombre_producto}<br>
            $${d.precio}<br>
            Pantallas: ${d.cantidad}
          </div>
        `;
      });
    }

    let wa = `https://wa.me/${p.whatsapp}?text=Hola%20${p.nombre}%20sobre%20tu%20pedido%20${p.ticket}`;

    html += `
      <div class="card">

        <h3>🎟 ${p.ticket}</h3>
        <p>${p.nombre} ${p.apellido || ""}</p>

        ${detalleHTML}

        <p><b>Total: $${p.total}</b></p>

        <a href="${wa}" target="_blank">
          <button>💬 WhatsApp</button>
        </a>

        ${
          p.estado === "pendiente"
          ? `<button onclick="completar('${p.id}')">Completar</button>`
          : `<p>✔ Completado</p>`
        }

        <!-- 🔥 NUEVO BOTÓN ELIMINAR -->
        <button style="background:red" onclick="eliminarPedido('${p.id}')">
          Eliminar
        </button>

      </div>
    `;
  }

  document.getElementById("contenido").innerHTML = html;
}

// ================= ELIMINAR PEDIDO =================
async function eliminarPedido(id){

  if(!confirm("¿Eliminar este pedido?")) return;

  // eliminar items primero
  await supabaseClient
    .from("pedido_items")
    .delete()
    .eq("pedido_id", id);

  // eliminar pedido
  await supabaseClient
    .from("pedidos")
    .delete()
    .eq("id", id);

  pedidos();
}

// ================= COMPLETAR =================
async function completar(id){

  let { data: pedido } = await supabaseClient
    .from("pedidos")
    .select("*")
    .eq("id",id)
    .single();

  await supabaseClient
    .from("pedidos")
    .update({estado:"completado"})
    .eq("id",id);

  let { data: items } = await supabaseClient
    .from("pedido_items")
    .select("*")
    .eq("pedido_id",id);

  if(items){
    for(let d of items){
      await supabaseClient.from("cuentas_activas").insert([{
        cliente: pedido.nombre,
        whatsapp: pedido.whatsapp,
        servicio: d.nombre_producto,
        pantallas: d.cantidad,
        vence: new Date(Date.now()+30*24*60*60*1000).toISOString()
      }]);
    }
  }

  pedidos();
}

// ================= RESTO =================
async function cuentas(){
  let { data } = await supabaseClient.from("cuentas_activas").select("*");

  let html="";
  data.forEach(c=>{
    let dias = Math.ceil((new Date(c.vence)-new Date())/(1000*60*60*24));
    html+=`<div class="card"><h3>${c.cliente}</h3><p>${c.servicio}</p><p>${dias} días</p></div>`;
  });

  document.getElementById("contenido").innerHTML = html;
}

async function proveedores(){
  let { data } = await supabaseClient.from("proveedores").select("*");

  let html = `
    <h1>🏢 Proveedores</h1>
    <input id="prov" placeholder="Nombre Proveedor"><button onclick="crearProveedor()">Crear</button>
  `;

  data.forEach(p=>{
    html+=`<div class="card">${p.nombre}<button onclick="eliminarProveedor('${p.id}')">Eliminar</button></div>`;
  });

  document.getElementById("contenido").innerHTML = html;
}

async function crearProveedor(){
  await supabaseClient.from("proveedores").insert([{nombre:prov.value}]);
  proveedores();
}

async function eliminarProveedor(id){
  await supabaseClient.from("proveedores").delete().eq("id",id);
  proveedores();
}

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






// ================= MODAL CREAR =================
window.modalCrear = async function(){

  let { data: servicios } = await supabaseClient.from("servicios").select("*") || [];
  listaServicios = servicios || [];

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
};


// ================= MODAL EDITAR =================
window.modalEditar = async function(id){

  let { data } = await supabaseClient
    .from("productos")
    .select("*")
    .eq("id",id)
    .single();

  let { data: servicios } = await supabaseClient.from("servicios").select("*") || [];
  listaServicios = servicios || [];

  let opciones = listaServicios.map(s =>
    `<option value="${s.nombre}"></option>`
  ).join("");

  cerrarModal();

  document.body.insertAdjacentHTML("beforeend", `
    <div class="modal" id="modal">
      <div class="modal-box">

        <h3>✏️ Editar Producto</h3>

        <label>Servicio</label>
        <input list="serviciosList" id="e_nombre"
        value="${data.nombre}"
        oninput="autocompletarServicio('e_nombre','e_img')">
        <datalist id="serviciosList">${opciones}</datalist>

        <label>Imagen</label>
        <input id="e_img" value="${data.imagen_url || ""}">

        <label>Descripción</label>
        <input id="e_desc" value="${data.descripcion || ""}">

        <label>Precio</label>
        <input id="e_precio" type="number" value="${data.precio}">

        <label>Costo</label>
        <input id="e_costo" type="number" value="${data.costo || 0}">

        <label>Tipo</label>
        <select id="e_tipo" onchange="togglePantallas()">
          <option value="pantalla" ${data.tipo==="pantalla"?"selected":""}>Pantalla</option>
          <option value="completa" ${data.tipo==="completa"?"selected":""}>Completa</option>
        </select>

        <div id="pantallasBox">
          <label>Máx pantallas</label>
          <input id="e_pantallas" type="number" value="${data.max_pantallas || ""}">
        </div>

        <button onclick="guardarEdit('${id}')">Guardar</button>
        <button onclick="cerrarModal()">Cancelar</button>

      </div>
    </div>
  `);

  togglePantallas();
};


// ================= TOGGLE PANTALLAS (FIX REAL) =================
window.togglePantallas = function(){

  let tipo =
    document.getElementById("n_tipo") ||
    document.getElementById("e_tipo");

  let box = document.getElementById("pantallasBox");

  if(!tipo || !box) return;

  box.style.display = tipo.value === "completa" ? "none" : "block";
};


// ================= CERRAR MODAL (SEGURO) =================
window.cerrarModal = function(){
  let m = document.getElementById("modal");
  if(m) m.remove();
};