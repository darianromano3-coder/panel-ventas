let intervaloPedidos = null;
let filtroPedidos = "";

// ================= PEDIDOS =================
window.pedidos = async function(){

  let { data: pedidosData } = await supabaseClient
    .from("pedidos")
    .select("*")
    .order("fecha",{ascending:false});

  let html = `
    <h1>📦 Pedidos</h1>

    <input 
      id="buscadorPedidos" 
      placeholder="Buscar ticket, nombre o WhatsApp..."
      value="${filtroPedidos}"
      style="margin-bottom:10px;"
    >

    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:15px;">
      <button onclick="toggleCompletados()">
        ${mostrarCompletados ? "Ocultar" : "Ver"} completados
      </button>

      <button class="btn-danger" onclick="limpiarCompletados()">
        🧹 Limpiar completados (+7 días)
      </button>
    </div>
  `;

  for(let p of pedidosData){

    // 🔍 FILTRO
    let textoBusqueda = `${p.ticket} ${p.nombre} ${p.apellido} ${p.whatsapp}`.toLowerCase();

    if(filtroPedidos && !textoBusqueda.includes(filtroPedidos.toLowerCase())){
      continue;
    }

    if(p.estado === "completado" && !mostrarCompletados) continue;

    // 🔹 TRAER ITEMS
    let { data: items } = await supabaseClient
      .from("pedido_items")
      .select("*")
      .eq("pedido_id", p.id);

    let texto = `🎫 ${p.ticket}\n`;
    texto += `${p.nombre} ${p.apellido}\n`;
    texto += `${p.whatsapp}\n\n`;

    let mensajeWA = `🧾 *TU PEDIDO*\n\n`;
    mensajeWA += `🎫 Ticket: ${p.ticket}\n\n`;

    let total = 0;

    items.forEach((item,i)=>{

      let cantidad = item.cantidad;
      let subtotal = item.precio * cantidad;
      total += subtotal;

      let tipoTexto = (cantidad > 1)
        ? `${cantidad} pantallas`
        : `1 cuenta completa`;

      texto += `Pedido ${i+1} - ${tipoTexto} ${item.nombre_producto} ($${subtotal})\n`;

      mensajeWA += `📦 Pedido ${i+1}\n`;
      mensajeWA += `Servicio: ${item.nombre_producto}\n`;
      mensajeWA += `Cantidad: ${tipoTexto}\n`;
      mensajeWA += `Total: $${subtotal}\n\n`;
    });

    texto += `\nTotal: $${total}`;
    mensajeWA += `💰 TOTAL: $${total}`;

    html += `
      <div class="card">

        <pre style="white-space:pre-wrap; font-family:inherit;">
${texto}
        </pre>

        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">

          <a target="_blank"
            href="https://wa.me/${p.whatsapp}?text=${encodeURIComponent(mensajeWA)}">
            <button>💬 Cliente</button>
          </a>

          <button onclick="aprobarPedido('${p.id}')">✔ Aprobar</button>

          <button class="btn-danger" onclick="eliminarPedido('${p.id}')">
            🗑 Eliminar
          </button>

        </div>

      </div>
    `;
  }

  document.getElementById("contenido").innerHTML = html;

  // 🔍 EVENTO BUSCADOR
  setTimeout(()=>{
    let input = document.getElementById("buscadorPedidos");
    if(input){
      input.oninput = (e)=>{
  filtroPedidos = e.target.value;

  clearTimeout(window._busquedaTimer);

  window._busquedaTimer = setTimeout(()=>{
    pedidos();
  }, 1000);
};
    }
  },0);
}

// ================= TOGGLE =================
function toggleCompletados(){
  mostrarCompletados = !mostrarCompletados;
  pedidos();
}

// ================= ELIMINAR =================
window.eliminarPedido = async function(id){

  if(!confirm("¿Eliminar pedido completo?")) return;

  await supabaseClient
    .from("pedido_items")
    .delete()
    .eq("pedido_id", id);

  await supabaseClient
    .from("pedidos")
    .delete()
    .eq("id", id);

  pedidos();
};

// ================= LIMPIAR COMPLETADOS =================
window.limpiarCompletados = async function(){

  if(!confirm("Esto eliminará pedidos completados de más de 7 días. ¿Continuar?")) return;

  let hace7dias = new Date();
  hace7dias.setDate(hace7dias.getDate() - 7);

  let fechaISO = hace7dias.toISOString();

  // 1. traer pedidos a borrar
  let { data: pedidosViejos } = await supabaseClient
    .from("pedidos")
    .select("id")
    .eq("estado", "completado")
    .lt("fecha", fechaISO);

  if(!pedidosViejos || pedidosViejos.length === 0){
    alert("No hay pedidos para limpiar");
    return;
  }

  let ids = pedidosViejos.map(p=>p.id);

  // 2. borrar items
  await supabaseClient
    .from("pedido_items")
    .delete()
    .in("pedido_id", ids);

  // 3. borrar pedidos
  await supabaseClient
    .from("pedidos")
    .delete()
    .in("id", ids);

  alert("🧹 Pedidos limpiados");

  pedidos();
};


// ================= APROBAR PEDIDO =================
window.aprobarPedido = async function(id){

  try {

    console.log("Aprobando pedido:", id);

    // 🔹 traer pedido
    let { data: pedido, error } = await supabaseClient
      .from("pedidos")
      .select("*")
      .eq("id", id)
      .single();

    if(error){
      console.error(error);
      alert("Error obteniendo pedido");
      return;
    }

    // 🔹 GUARDAR CLIENTE (solo datos básicos)
    let { error: errInsert } = await supabaseClient
      .from("clientes")
      .insert([{
        nombre: pedido.nombre,
        apellido: pedido.apellido,
        whatsapp: pedido.whatsapp,
        fecha_inicio: new Date().toISOString()
      }]);

    if(errInsert){
      console.error("Error creando cliente:", errInsert);
      alert("Error guardando cliente");
      return;
    }

    // 🔹 marcar pedido como completado
    await supabaseClient
      .from("pedidos")
      .update({ estado: "completado" })
      .eq("id", id);

    alert("✅ Pedido aprobado y cliente guardado");

    pedidos();

  } catch(err){
    console.error(err);
    alert("Error: " + errInsert.message);
console.error(errInsert);
  }
};

// 🔄 AUTO REFRESH
clearInterval(intervaloPedidos);

intervaloPedidos = setInterval(()=>{

  if(vistaActual === "pedidos" && !filtroPedidos){
    pedidos();
  }

}, 5000);