// ================= PROVEEDORES =================
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

  if(!prov_nombre.value) return;

  await supabaseClient.from("proveedores").insert([{
    nombre: prov_nombre.value
  }]);

  proveedores();
};

window.eliminarProveedor = async function(id){

  if(!confirm("¿Eliminar proveedor?")) return;

  await supabaseClient.from("proveedores")
    .delete()
    .eq("id",id);

  proveedores();
};