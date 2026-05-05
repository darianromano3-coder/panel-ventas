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

  setTimeout(()=>{
    const input = document.getElementById("buscador");
    if(input){
      input.value = filtroActual;
      input.oninput = (e)=>{
        filtroActual = e.target.value;
        renderProductos();
      };
    }
  },0);
}

// ================= ELIMINAR PRODUCTO =================
window.eliminarProducto = async function(id){

  if(!confirm("¿Eliminar producto?")) return;

  await supabaseClient.from("productos")
    .delete()
    .eq("id",id);

  productos();
};

// ================= MODAL CREAR PRODUCTO =================
window.modalCrear = async function(){

  let { data: servicios } = await supabaseClient
    .from("servicios")
    .select("*");

  document.body.insertAdjacentHTML("beforeend", `
    <div class="modal" id="modal">
      <div class="modal-box">

        <h3>➕ Crear Producto</h3>

        <label>Servicio</label>
        <select id="n_servicio" onchange="rellenarServicio()">
          <option value="">Seleccionar</option>
          ${servicios.map(s =>
            `<option value="${s.nombre}" data-img="${s.imagen_url || ""}">
              ${s.nombre}
            </option>`
          ).join("")}
        </select>

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

// ================= AUTOCOMPLETAR =================
window.rellenarServicio = function(){

  const select = document.getElementById("n_servicio");
  const option = select.options[select.selectedIndex];

  document.getElementById("n_img").value =
    option?.dataset?.img || "";
};

// ================= CREAR PRODUCTO =================
window.crearProducto = async function(){

  await supabaseClient.from("productos").insert([{
    nombre: n_servicio.value,
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

// ================= EDITAR =================
window.modalEditar = async function(id){

  let { data } = await supabaseClient
    .from("productos")
    .select("*")
    .eq("id",id)
    .single();

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

// ================= TOGGLE =================
window.togglePantallas = function(){

  const tipo = document.getElementById("n_tipo");
  const box = document.getElementById("pantallasBox");

  if(!tipo || !box) return;

  box.style.display = (tipo.value === "completa") ? "none" : "block";
};

// ================= UTIL =================
window.cerrarModal = function(){
  document.getElementById("modal")?.remove();
};

window.toggleCompletados = function(){
  mostrarCompletados = !mostrarCompletados;
  pedidos();
};