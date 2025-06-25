// ========== FUNCIONES GLOBALES ==========

function escanearAhora() {
  mostrarNotificacion(`<span class="inline-flex items-center gap-2">
    <svg class="w-4 h-4 animate-spin text-orange-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16 8 8 0 01-8-8z"></path>
    </svg> Escaneando red...
  </span>`, "info");

  fetch("/api/scan")
    .then(res => res.json())
    .then(data => {
      mostrarNotificacion(`<span class="inline-flex items-center gap-2">
        <svg class="w-4 h-4 text-green-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg> Escaneo completo
      </span>`, "success");
      actualizarTabla(data);
    })
    .catch(() => {
      mostrarNotificacion(`❌ Error al escanear`, "error");
    });
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  const label = document.getElementById("modo-label");
  if (label) {
    label.textContent = document.body.classList.contains("dark-mode") ? "Modo Día" : "Modo Noche";
  }
}

// ========== DOMContentLoaded ==========

document.addEventListener("DOMContentLoaded", () => {
  function mostrarNotificacion(mensaje, tipo = "info") {
    const noti = document.getElementById("notificacion");
    const colores = {
      info: "bg-orange-100 text-orange-800",
      success: "bg-green-100 text-green-800",
      error: "bg-red-100 text-red-800",
      warning: "bg-yellow-100 text-yellow-800",
    };
    noti.innerHTML = mensaje;
    noti.className = `fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 max-w-sm w-full ${colores[tipo] || colores.info}`;
    noti.classList.remove("hidden");
    setTimeout(() => noti.classList.add("hidden"), 3000);
  }

  document.getElementById("form-agregar").addEventListener("submit", async (e) => {
    e.preventDefault();
    const mac = document.getElementById("input-mac").value.trim();
    if (!mac) return;

    mostrarNotificacion(`Agregando MAC...`, "info");

    try {
      const res = await fetch("/api/agregar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mac }),
      });
      const data = await res.json();
      if (data.success) {
        mostrarNotificacion("✅ " + data.message, "success");
        setTimeout(() => location.reload(), 1000);
      } else {
        mostrarNotificacion("❌ " + data.message, "error");
      }
    } catch {
      mostrarNotificacion("Error de conexión", "error");
    }
  });

  // Esto está dentro porque se llama solo desde los botones generados
  window.eliminarMAC = function (mac) {
    mostrarNotificacion("Eliminando MAC...", "info");

    fetch("/api/eliminar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mac }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          mostrarNotificacion("✅ " + data.message, "success");
          setTimeout(() => location.reload(), 1000);
        } else {
          mostrarNotificacion("❌ " + data.message, "error");
        }
      })
      .catch(() => mostrarNotificacion("Error de conexión", "error"));
  };

  window.verPuertos = function (ip) {
    mostrarNotificacion(`🔍 Escaneando puertos de ${ip}...`, "info");

    fetch("/api/puertos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.puertos.length === 0) {
            mostrarNotificacion(`✅ No se encontraron puertos abiertos en ${ip}`, "success");
          } else {
            const lista = data.puertos.map(p => `${p.puerto} (${p.servicio})`).join(", ");
            mostrarNotificacion(`<strong>Puertos abiertos en ${ip}:</strong><br>${lista}`, "success");
          }
        } else {
          mostrarNotificacion(`❌ Error: ${data.message}`, "error");
        }
      })
      .catch(() => mostrarNotificacion("❌ Error al consultar puertos", "error"));
  };

  function actualizarTabla(dispositivos) {
    const tabla = document.getElementById("tabla-dispositivos");
    tabla.innerHTML = "";

    dispositivos.forEach(d => {
      const row = document.createElement("tr");
      row.className = "hover:bg-orange-50";
      row.innerHTML = `
        <td class="px-4 py-3">${d.ip}</td>
        <td class="px-4 py-3">${d.mac}</td>
        <td class="px-4 py-3">${d.fabricante}</td>
        <td class="px-4 py-3">
          ${d.confiable
            ? `<span class='inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium'>
                ✅ Confiable
              </span>`
            : `<span class='inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium'>
                ❌ No confiable
              </span>`}
          <br/>
          <button onclick="verPuertos('${d.ip}')" class="inline-flex items-center gap-2 mt-2 text-xs font-medium bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition duration-200">
            Ver puertos
          </button>
        </td>
      `;
      tabla.appendChild(row);
    });
  }

  // Escaneo automático cada 60 segundos
  setInterval(() => escanearAhora(), 60000);
});
