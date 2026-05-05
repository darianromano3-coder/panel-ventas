window.dashboard = async function(){

  // ================= USUARIOS =================
  // ================= USUARIOS =================
let { data, error } = await supabaseClient
  .from("usuarios")
  .select("fecha_expiracion");

let usuarios = Array.isArray(data) ? data : [];

if(error){
  console.error("ERROR USUARIOS:", error);
}

let total = usuarios.length;
let activos = 0;
let hoyCount = 0;
let pronto = 0;
let vencidos = 0;

let hoy = new Date();
hoy.setHours(0,0,0,0);

usuarios.forEach(u => {

  if(!u.fecha_expiracion){
    vencidos++;
    return;
  }

  let [y, m, d] = u.fecha_expiracion.split("-").map(Number);
  let fecha = new Date(y, m - 1, d);
  fecha.setHours(0,0,0,0);

  let diff = Math.floor((fecha - hoy) / (1000 * 60 * 60 * 24));

  if(diff < 0){
    vencidos++;
  } 
  else if(diff === 0){
    hoyCount++;
    activos++;
  } 
  else if(diff >= 1 && diff <= 3){
    pronto++;
    activos++;
  } 
  else if(diff > 3){
    activos++;
  }

});
  // ================= PEDIDOS =================
  let { data: dataPedidos, error: errorPedidos } = await supabaseClient
  .from("pedidos")
  .select("estado, fecha");

let pedidos = Array.isArray(dataPedidos) ? dataPedidos : [];

if(errorPedidos){
  console.error("ERROR PEDIDOS:", errorPedidos);
}

  let mesActual = new Date().getMonth();
  let anioActual = new Date().getFullYear();

  let totalPedidos = 0;
  let completados = 0;

  pedidos.forEach(p => {
    let f = new Date(p.fecha);

    if(f.getMonth() === mesActual && f.getFullYear() === anioActual){
      totalPedidos++;
      if(p.estado === "completado") completados++;
    }
  });

  // ================= HTML =================
  let html = `
    <h1>📊 Dashboard</h1>

    <h2>👤 Usuarios</h2>
    <div class="grid-dashboard">

      <div class="card-dashboard">
        <span>Total</span>
        <b>${total}</b>
      </div>

      <div class="card-dashboard">
        <span>Activos</span>
        <b>${activos}</b>
      </div>

      <div class="card-dashboard">
        <span>Vencen hoy</span>
        <b>${hoyCount}</b>
      </div>

      <div class="card-dashboard">
        <span>Pronto</span>
        <b>${pronto}</b>
      </div>

      <div class="card-dashboard">
        <span>Vencidos</span>
        <b>${vencidos}</b>
      </div>

    </div>

    <h2 style="margin-top:20px;">📦 Pedidos</h2>
    <div class="grid-dashboard">

      <div class="card-dashboard">
        <span>Total</span>
        <b>${totalPedidos}</b>
      </div>

      <div class="card-dashboard">
        <span>Completados</span>
        <b>${completados}</b>
      </div>

    </div>

    <button class="btn-dashboard" onclick="limpiarPedidos()">
      🧹 Limpiar pedidos
    </button>
  `;

  document.getElementById("contenido").innerHTML = html;
};

// ================= LIMPIAR SOLO PEDIDOS (VISUAL) =================
window.limpiarPedidos = function(){

  let confirmar = confirm("¿Limpiar solo pedidos del dashboard?");

  if(!confirmar) return;

  // 🔥 mantener usuarios (no tocamos nada arriba)

  // 🔥 reemplazar SOLO sección pedidos
  let seccionPedidos = `
    <h2 style="margin-top:20px;">📦 Pedidos</h2>
    <div class="grid-dashboard">

      <div class="card-dashboard">
        <span>Total</span>
        <b>0</b>
      </div>

      <div class="card-dashboard">
        <span>Completados</span>
        <b>0</b>
      </div>

    </div>

    <button class="btn-dashboard" onclick="dashboard()">
      🔄 Recargar pedidos
    </button>
  `;

  // 🔥 reemplazar solo esa parte en el HTML actual
  let contenedor = document.getElementById("contenido");

  // dividir por sección pedidos
  let partes = contenedor.innerHTML.split("📦 Pedidos");

  if(partes.length > 1){
    contenedor.innerHTML = partes[0] + seccionPedidos;
  }

};