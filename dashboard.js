function normalizeDate(dateStr) {
  if (!dateStr) return null;

  let [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/* ================= WHATSAPP ================= */
function wa(t, n, s, v) {
  let telefono = (t || "").toString().replace(/\D/g, "");

  window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(
`Hola ${n}, te recordamos que tu servicio ${s} vence o venció el ${v}`
  )}`);
}

/* ================= RENOVAR ================= */
async function renovar(id){

  let c = window.clientesCache.find(x => x.id == id);
  if(!c) return;

  // 🔥 FECHA MANUAL
  let nuevaFecha = prompt("Ingrese nueva fecha (YYYY-MM-DD):", c.vencimiento || "");

  if(!nuevaFecha){
    alert("Cancelado");
    return;
  }

  // validar formato
  if(!/^\d{4}-\d{2}-\d{2}$/.test(nuevaFecha)){
    alert("Formato inválido. Usa YYYY-MM-DD");
    return;
  }

  // actualizar cliente
  const { error } = await client
    .from("clientes")
    .update({ vencimiento: nuevaFecha })
    .eq("id", id);

  if(error){
    console.log(error);
    alert("Error al renovar");
    return;
  }

  // 🔥 registrar ingreso
  let ganancia = (Number(c.venta) || 0) - (Number(c.costo) || 0);

  await client.from("ingresos").insert([{
    cliente_id: c.id,
    nombre: c.nombre + " " + c.apellido,
    servicio: c.servicio,
    monto: ganancia
  }]);

  alert("Renovación guardada 💰");

  loadDashboard();
}

async function loadDashboard() {

  const { data } = await client.from("clientes").select("*");

  if (!data) return;

  // 🔥 CACHE GLOBAL
  window.clientesCache = data;

  let hoy = new Date();
  hoy.setHours(0,0,0,0);

  let totalClientes = data.length;

  // 🔥 GANANCIAS DESDE INGRESOS
  let { data: ingresos } = await client.from("ingresos").select("monto");

  let gananciaTotal = 0;
  if (ingresos) {
    ingresos.forEach(i => {
      gananciaTotal += Number(i.monto) || 0;
    });
  }

  let vencenHoy = [];
  let vencenProx = [];
  let vencidos = [];

  data.forEach(c => {

    if (!c.vencimiento) return;

    let v = normalizeDate(c.vencimiento);
    let diff = (v - hoy) / (1000 * 60 * 60 * 24);

    if (diff === 0) vencenHoy.push(c);
    if (diff > 0 && diff <= 3) vencenProx.push(c);
    if (diff < 0) vencidos.push(c);
  });

  // ================= MÉTRICAS =================
  document.getElementById("total").innerText = "Clientes: " + totalClientes;
  document.getElementById("ganancia").innerText = "Ganancia: $" + gananciaTotal;
  document.getElementById("vHoy").innerText = "Vencen Hoy: " + vencenHoy.length;
  document.getElementById("vProx").innerText = "Vencen Próx: " + vencenProx.length;

  // ================= HOY =================
  document.getElementById("listaHoy").innerHTML =
    vencenHoy.length
      ? vencenHoy.map(c => `
        <div style="margin-bottom:8px;">
          <b>${c.nombre} ${c.apellido}</b> - ${c.servicio} (${c.vencimiento})

          <button onclick="wa('${c.celular}','${c.nombre}','${c.servicio}','${c.vencimiento}')">
            WhatsApp
          </button>

          <button onclick="renovar('${c.id}')">
            💰 Renovar
          </button>

        </div>
      `).join("")
      : "<p>Sin vencimientos hoy</p>";

  // ================= PRÓXIMOS =================
  document.getElementById("listaProx").innerHTML =
    vencenProx.length
      ? vencenProx.map(c => `
        <div style="margin-bottom:8px;">
          <b>${c.nombre} ${c.apellido}</b> - ${c.servicio} (${c.vencimiento})

          <button onclick="wa('${c.celular}','${c.nombre}','${c.servicio}','${c.vencimiento}')">
            WhatsApp
          </button>

          <button onclick="renovar('${c.id}')">
            💰 Renovar
          </button>

        </div>
      `).join("")
      : "<p>Sin próximos vencimientos</p>";

  // ================= VENCIDOS =================
  document.getElementById("listaVencidos").innerHTML =
    vencidos.length
      ? vencidos.map(c => `
        <div style="color:#f87171; margin-bottom:8px;">
          <b>${c.nombre} ${c.apellido}</b> - ${c.servicio} (VENCIÓ: ${c.vencimiento})

          <button onclick="wa('${c.celular}','${c.nombre}','${c.servicio}','${c.vencimiento}')">
            Recontactar
          </button>

          <button onclick="renovar('${c.id}')">
            💰 Renovar
          </button>

        </div>
      `).join("")
      : "<p>No hay clientes vencidos</p>";
}

loadDashboard();