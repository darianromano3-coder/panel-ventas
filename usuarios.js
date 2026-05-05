function sumarDiasSeguro(yyyy, mm, dd, dias){
  const diasMes = (a, m) => new Date(a, m, 0).getDate(); // solo para saber días del mes

  let y = yyyy;
  let m = mm;
  let d = dd + dias;

  while(true){
    let max = diasMes(y, m);
    if(d <= max) break;
    d -= max;
    m++;
    if(m > 12){
      m = 1;
      y++;
    }
  }

  return {
    y,
    m: String(m).padStart(2,"0"),
    d: String(d).padStart(2,"0")
  };
}
//============= NI IDEAAA JAJAJ=========
let filtroUsuarios = "";
let usuariosGlobal = [];

// ================= USUARIOS =================
window.usuarios = async function(){

  let { data } = await supabaseClient
    .from("usuarios")
    .select("*")
    .order("fecha_expiracion", { ascending: true });

  usuariosGlobal = data;

  renderUsuarios(data);
};

  function renderUsuarios(data){

  let html = `
    <h1>📺 Usuarios</h1>

    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:15px;">
      <input 
  id="buscadorUsuarios" 
  placeholder="Buscar perfil, nombre o servicio..."
  value="${filtroUsuarios}"
>
      <button onclick="abrirModalUsuario()">➕ Nuevo Usuario</button>
    </div>

    <div style="overflow:auto;">
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="background:#111827;">
            <th>Nombre</th>
            <th>Celular</th>
            <th>Servicio</th>
            <th>Correo</th>
            <th>Clave</th>
            <th>Perfil</th>
            <th>PIN</th>
            <th>Precio</th>
            <th>Expiración</th>
            <th>Alerta</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
  `;

  data.forEach(u=>{

    // 🔥 fecha para cálculos (SIN bug de zona)
let [y, m, d] = u.fecha_expiracion.split("-").map(Number);
let fechaCalc = new Date(y, m - 1, d);

let hoy = new Date();
hoy.setHours(0,0,0,0);

// 🔥 cálculo correcto
let diff = Math.round((fechaCalc - hoy) / (1000 * 60 * 60 * 24));

// 🔥 fecha para mostrar (string)
let fecha = `${String(d).padStart(2,"0")}/${String(m).padStart(2,"0")}/${y}`;

    let alerta = "";
    let color = "";

    if(diff < 0){
      alerta = `Vencido hace ${Math.abs(diff)} días`;
      color = "red";
    } else if(diff === 0){
      alerta = "Vence hoy";
      color = "orange";
    } else if(diff <= 3){
      alerta = `Quedan ${diff} días`;
      color = "yellow";
    } else {
      alerta = `${diff} días`;
      color = "green";
    }

    // 🔥 MENSAJE WHATSAPP
    let mensaje = `Hola ${u.nombre}, ¿cómo estás? Te recuerdo que tu servicio ${u.tipo_cuenta} vence el ${fecha}. ¿Deseas renovarlo?`;
    let urlWA = `https://wa.me/${u.celular}?text=${encodeURIComponent(mensaje)}`;

    html += `
      <tr style="border-bottom:1px solid #222;">

        <td>${u.nombre}</td>
        <td>${u.celular}</td>
        <td>${u.tipo_cuenta}</td>
        <td>${u.correo}</td>
        <td>${u.clave}</td>
        <td>${u.perfil}</td>
        <td>${u.pin}</td>
        <td>$${u.precio}</td>
        <td>${fecha}</td>

        <td style="color:${color}; font-weight:bold;">
          ${alerta}
        </td>

        <td style="display:flex; gap:5px; flex-wrap:wrap;">

          <button onclick="editarUsuario('${u.id}')">✏️</button>

          <button onclick="renovarUsuario('${u.id}')">🔄</button>

          <a href="${urlWA}" target="_blank">
            <button>💬</button>
          </a>

          <button class="btn-danger" onclick="eliminarUsuario('${u.id}')">🗑</button>

        </td>

      </tr>
    `;
  });

  html += `</tbody></table></div>`;

  document.getElementById("contenido").innerHTML = html;
}

//============== BUSCADOR PRO ===========================
document.addEventListener("input", (e)=>{

  if(e.target.id === "buscadorUsuarios"){

    // 🔥 guardar lo que escribe el usuario
    filtroUsuarios = e.target.value;

    let texto = filtroUsuarios.toLowerCase();

    let filtrados = usuariosGlobal.filter(u=>{
      let combinado = `${u.perfil} ${u.nombre} ${u.tipo_cuenta}`.toLowerCase();
      return combinado.includes(texto);
    });

    renderUsuarios(filtrados);

    // 🔥 mantener foco y cursor
    setTimeout(()=>{
      let input = document.getElementById("buscadorUsuarios");
      if(input){
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    },0);

  }

});


// ================= MODAL =================
window.abrirModalUsuario = function(){

  document.body.insertAdjacentHTML("beforeend", `
    <div class="modal" id="modal">
      <div class="modal-box">

        <h3>➕ Nuevo Usuario</h3>

        
        <input id="u_nombre" placeholder="Nombre">
        <input id="u_celular" placeholder="Celular">
        <input id="u_tipo" placeholder="Servicio (Netflix, Disney...)">
        <input id="u_correo" placeholder="Correo">
        <input id="u_clave" placeholder="Clave">
        <input id="u_perfil" placeholder="Perfil">
        <input id="u_pin" placeholder="PIN">
        <input id="u_precio" placeholder="Precio">
        <input id="u_fecha" type="date">

        <button onclick="crearUsuario()">Guardar</button>
        <button onclick="cerrarModal()">Cancelar</button>

      </div>
    </div>
  `);
};



// ================= CREAR =================
window.crearUsuario = async function(){

  await supabaseClient.from("usuarios").insert([{
    perfil: u_perfil.value,
    nombre: u_nombre.value,
    tipo_cuenta: u_tipo.value,
    celular: u_celular.value,
    pin: u_pin.value,
    correo: u_correo.value,
    clave: u_clave.value,
    precio: Number(u_precio.value || 0),
    fecha_expiracion: u_fecha.value
  }]);

  cerrarModal();
  usuarios();
};



// ================= ELIMINAR =================
window.eliminarUsuario = async function(id){

  if(!confirm("¿Eliminar usuario?")) return;

  await supabaseClient
    .from("usuarios")
    .delete()
    .eq("id", id);

  usuarios();
};



// ================= EDITAR =================
window.editarUsuario = async function(id){

  // 🔹 traer datos del usuario
  let { data: u, error } = await supabaseClient
    .from("usuarios")
    .select("*")
    .eq("id", id)
    .single();

  if(error){
    console.error(error);
    alert("Error cargando usuario");
    return;
  }

  // 🔹 abrir modal con datos cargados
  document.body.insertAdjacentHTML("beforeend", `
    <div class="modal" id="modal">
      <div class="modal-box">

        <h3>✏️ Editar Usuario</h3>

        <input id="e_nombre" value="${u.nombre || ""}">
        <input id="e_celular" value="${u.celular || ""}">
        <input id="e_tipo" value="${u.tipo_cuenta || ""}">
        <input id="e_correo" value="${u.correo || ""}">
        <input id="e_clave" value="${u.clave || ""}">
        <input id="e_perfil" value="${u.perfil || ""}">
        <input id="e_pin" value="${u.pin || ""}">
        <input id="e_precio" value="${u.precio || 0}">
        <input id="e_fecha" type="date" value="${u.fecha_expiracion || ""}">

        <button onclick="guardarUsuarioEdit('${id}')">Guardar cambios</button>
        <button onclick="cerrarModal()">Cancelar</button>

      </div>
    </div>
  `);
};


// ================= GUARDAR EDICIÓN =================
window.guardarUsuarioEdit = async function(id){

  let { error } = await supabaseClient
    .from("usuarios")
    .update({
      nombre: e_nombre.value,
      celular: e_celular.value,
      tipo_cuenta: e_tipo.value,
      correo: e_correo.value,
      clave: e_clave.value,
      perfil: e_perfil.value,
      pin: e_pin.value,
      precio: Number(e_precio.value || 0),
      fecha_expiracion: e_fecha.value
    })
    .eq("id", id);

  if(error){
    console.error(error);
    alert("Error al guardar cambios");
    return;
  }

  cerrarModal();
  usuarios();
};


//=================RENOVAR USUARIOS=========================
window.renovarUsuario = async function(id){

  let { data: u, error } = await supabaseClient
    .from("usuarios")
    .select("fecha_expiracion")
    .eq("id", id)
    .single();

  if(error){
    console.error(error);
    alert("Error obteniendo usuario");
    return;
  }

  // 🔥 HOY en string (seguro)
  let hoy = new Date();
  let hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}-${String(hoy.getDate()).padStart(2,"0")}`;

  // 🔥 base correcta
  let baseStr = (u.fecha_expiracion >= hoyStr) ? u.fecha_expiracion : hoyStr;

  // 🔥 separar
  let [y, m, d] = baseStr.split("-").map(Number);

  // 🔥 SUMAR 30 DÍAS SIN Date
  let res = sumarDiasSeguro(y, m, d, 30);

  let nuevaFecha = `${res.y}-${res.m}-${res.d}`;

  let { error: errorUpdate } = await supabaseClient
    .from("usuarios")
    .update({ fecha_expiracion: nuevaFecha })
    .eq("id", id);

  if(errorUpdate){
    console.error(errorUpdate);
    alert("Error al renovar");
    return;
  }

  usuarios();
};

//===============RENOVAR MANUAL==================

window.renovarManual = function(id){

  let fecha = prompt("Nueva fecha (YYYY-MM-DD)");

  if(!fecha) return;

  supabaseClient
    .from("usuarios")
    .update({ fecha_expiracion: fecha })
    .eq("id", id);

  usuarios();
};