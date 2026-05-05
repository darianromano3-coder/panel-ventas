let filtroClientes = "";

// ================= CLIENTES =================
window.clientes = async function(){

  let { data } = await supabaseClient
    .from("clientes")
    .select("*")
    .order("fecha_inicio", { ascending: false });

  let html = `
    <h1>👤 Clientes</h1>

    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:15px;">
      <input 
        id="buscadorClientes"
        placeholder="Buscar nombre o WhatsApp..."
        value="${filtroClientes}"
      >

      <button onclick="abrirModalCliente()">➕ Nuevo Cliente</button>
    </div>

    <div style="overflow:auto;">
      <table style="width:100%; border-collapse:collapse;">

        <thead>
          <tr style="background:#111827;">
            <th>Nombre</th>
            <th>Apellido</th>
            <th>WhatsApp</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
  `;

  data.forEach(c=>{

    let texto = `${c.nombre} ${c.apellido} ${c.whatsapp}`.toLowerCase();

    if(filtroClientes && !texto.includes(filtroClientes.toLowerCase())){
      return;
    }

    let fecha = c.fecha_inicio
      ? new Date(c.fecha_inicio).toLocaleDateString()
      : "-";

    html += `
      <tr style="border-bottom:1px solid #222;">

        <td>${c.nombre}</td>
        <td>${c.apellido || "-"}</td>
        <td>${c.whatsapp || "-"}</td>
        <td>${fecha}</td>

        <td style="display:flex; gap:5px; flex-wrap:wrap;">

          <button onclick="editarCliente('${c.id}')">✏️</button>

          <button class="btn-danger" onclick="eliminarCliente('${c.id}')">
            🗑
          </button>

        </td>

      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("contenido").innerHTML = html;

  // BUSCADOR
  setTimeout(()=>{
    let input = document.getElementById("buscadorClientes");
    if(input){
      input.oninput = (e)=>{
        filtroClientes = e.target.value;
        clientes();
      };
    }
  },0);
};



// ================= MODAL CREAR =================
window.abrirModalCliente = function(){

  document.body.insertAdjacentHTML("beforeend", `
    <div class="modal" id="modal">
      <div class="modal-box">

        <h3>➕ Nuevo Cliente</h3>

        <input id="c_nombre" placeholder="Nombre">
        <input id="c_apellido" placeholder="Apellido">
        <input id="c_whatsapp" placeholder="WhatsApp">

        <button onclick="crearCliente()">Guardar</button>
        <button onclick="cerrarModal()">Cancelar</button>

      </div>
    </div>
  `);
};



// ================= CREAR =================
window.crearCliente = async function(){

  if(!c_nombre.value){
    alert("Nombre requerido");
    return;
  }

  await supabaseClient.from("clientes").insert([{
    nombre: c_nombre.value,
    apellido: c_apellido.value,
    whatsapp: c_whatsapp.value,
    fecha_inicio: new Date().toISOString()
  }]);

  cerrarModal();
  clientes();
};



// ================= EDITAR =================
window.editarCliente = async function(id){

  let { data } = await supabaseClient
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single();

  document.body.insertAdjacentHTML("beforeend", `
    <div class="modal" id="modal">
      <div class="modal-box">

        <h3>✏️ Editar Cliente</h3>

        <input id="e_nombre" value="${data.nombre}">
        <input id="e_apellido" value="${data.apellido || ""}">
        <input id="e_whatsapp" value="${data.whatsapp || ""}">

        <button onclick="guardarCliente('${id}')">Guardar</button>
        <button onclick="cerrarModal()">Cancelar</button>

      </div>
    </div>
  `);
};


window.guardarCliente = async function(id){

  await supabaseClient
    .from("clientes")
    .update({
      nombre: e_nombre.value,
      apellido: e_apellido.value,
      whatsapp: e_whatsapp.value
    })
    .eq("id", id);

  cerrarModal();
  clientes();
};



// ================= ELIMINAR =================
window.eliminarCliente = async function(id){

  if(!confirm("¿Eliminar cliente?")) return;

  await supabaseClient
    .from("clientes")
    .delete()
    .eq("id", id);

  clientes();
};