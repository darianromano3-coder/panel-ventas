const supabaseUrl = "https://kgwjjngjljmjewhlimex.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd2pqbmdqbGptamV3aGxpbWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1Njk4NTksImV4cCI6MjA5MzE0NTg1OX0.Qkxzddp4WG_pgbVaR24YvF9lVnejHLCDFGolGmyGvVQ";

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// estado global
let vistaActual = "";
let filtroActual = "";
let mostrarCompletados = false;

// navegación
function cargarVista(v){

  vistaActual = v; // 👈 guardamos vista actual

  if(v==="dashboard") dashboard();
  if(v==="productos") productos();
  if(v==="pedidos") pedidos();
  if(v==="servicios") servicios();
  if(v==="proveedores") proveedores();
  if(v==="usuarios") usuarios();
  if(v==="clientes") clientes();
}

// init
function initPanel(){
  cargarVista("pedidos");
}

initPanel();