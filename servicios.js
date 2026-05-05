// ================= SERVICIOS =================
window.servicios = async function(){

  let { data } = await supabaseClient.from("servicios").select("*");
  listaServicios = data || [];

  let html = `
    <h1>🎬 Servicios</h1>

    <div style="margin-bottom:15px;">
      <input id="serv_nombre" placeholder="Nombre del servicio">
      <input id="serv_img" placeholder="URL de imagen">
      <button onclick="crearServicio()">➕ Crear</button>
    </div>

    <div class="grid">
  `;

  data.forEach(s=>{
    html += `
      <div class="card">
        <img src="${s.imagen_url || 'https://via.placeholder.com/300'}" class="card-img">

        <h3>${s.nombre}</h3>

        <button class="btn-danger" onclick="eliminarServicio('${s.id}')">
          🗑 Eliminar
        </button>
      </div>
    `;
  });

  html += `</div>`;

  document.getElementById("contenido").innerHTML = html;
};


// ================= CREAR =================
window.crearServicio = async function(){

  if(!serv_nombre.value){
    alert("Escribe un nombre");
    return;
  }

  await supabaseClient.from("servicios").insert([{
    nombre: serv_nombre.value,
    imagen_url: serv_img.value
  }]);

  servicios();
};


// ================= ELIMINAR =================
window.eliminarServicio = async function(id){

  if(!confirm("¿Eliminar servicio?")) return;

  await supabaseClient.from("servicios")
    .delete()
    .eq("id",id);

  servicios();
};