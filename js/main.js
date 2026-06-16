let tarifas = [];

async function cargarTarifas() {
  try {
    const response = await fetch('/data/tarifas.json');
    tarifas = await response.json();
  } catch (error) {
    console.error('Error al cargar las tarifas:', error);
  }
}

cargarTarifas();

function calcularPrecioPorKm(distancia) {
  const tarifa = tarifas.find((t) => distancia >= t.minDistancia && distancia < t.maxDistancia);

  return tarifa ? tarifa.precioKm : 0;
}

function calcularCantidadDeViajes(kilogramos) {
  let toneladas = kilogramos / 1000;
  const maximoToneladasPorViaje = 37;
  const cantidadViajes = Math.ceil(toneladas / maximoToneladasPorViaje);

  return cantidadViajes;
}

function calcularPrecioTotal(distancia, kilogramos, clienteFrecuente) {
  const cantidadViajes = calcularCantidadDeViajes(kilogramos);
  const precioPorKm = calcularPrecioPorKm(distancia);
  const precioBase = distancia * precioPorKm;

  let precioBaseFinal = precioBase;
  let precioTotalFinal = 0;
  let preciosViajes = [];

  for (let i = 1; i <= cantidadViajes; i++) {
    let precioViaje;

    if (i === 1) {
      precioViaje = precioBase;
    } else {
      precioViaje = precioBase * 0.9;
    }

    preciosViajes.push(precioViaje);

    precioTotalFinal += precioViaje;

    precioBaseFinal = precioTotalFinal;
  }

  precioTotalFinal = preciosViajes.reduce((total, precio) => total + precio, 0);

  let precioDescuentoCliente = 0;

  if (clienteFrecuente) {
    precioDescuentoCliente = precioTotalFinal * 0.2;
    precioTotalFinal -= precioDescuentoCliente;
  }

  return { cantidadViajes, preciosViajes, precioBaseFinal, precioDescuentoCliente, precioTotalFinal };
}

function mostrarResultado() {
  event.preventDefault();

  const origen = document.getElementById('origen').value;
  const destino = document.getElementById('destino').value;
  const distancia = parseFloat(document.getElementById('distancia').value);
  const kilogramos = parseFloat(document.getElementById('kilogramos').value);
  const empresa = document.getElementById('empresa').value;
  const clienteFrecuente = document.getElementById('clienteFrecuente').checked;

  let resultado;

  if (!origen || !destino || isNaN(distancia) || isNaN(kilogramos) || !empresa) {
    resultado = `<p class="error">Se deben ingresar todos los datos para realizar la simulación</p>`;

    Swal.fire({
      title: 'Atención',
      icon: 'warning',
      text: 'Se deben ingresar todos los datos para realizar la simulación de forma correcta',
      padding: '0 0 40px',
      showConfirmButton: false,
      showCloseButton: true,
      showClass: {
        popup: `animate__animated animate__zoomIn animate__fadeIn animate__faster`,
      },
      hideClass: {
        popup: `animate__animated animate__zoomOut animate__fadeOut animate__faster`,
      },
    });
  } else {
    let calculoPrecioTotal = calcularPrecioTotal(distancia, kilogramos, clienteFrecuente);

    resultado = `
      <p><strong>Origen:</strong> ${origen}</p>
      <p><strong>Destino:</strong> ${destino}</p>
      <p><strong>Distancia (Km):</strong> ${distancia} Km</p>
      <p><strong>Peso (Kg):</strong> ${kilogramos} Kg</p>
      <p><strong>Empresa:</strong> ${empresa}</p>
    `;

    if (calculoPrecioTotal.cantidadViajes > 1) {
      resultado += `<p><strong>Cant. de viajes:</strong> ${calculoPrecioTotal.cantidadViajes}</p>`;

      calculoPrecioTotal.preciosViajes.forEach((precioViaje, index) => {
        resultado += `<p><strong>Precio del viaje ${index + 1}:</strong> USD ${Math.ceil(precioViaje)}</p>`;
      });
    }

    if (clienteFrecuente) {
      resultado += `
        <p><strong>Precio base:</strong> USD ${Math.ceil(calculoPrecioTotal.precioBaseFinal)}</p>
        <p><strong>Descuento cliente (20%):</strong> USD ${Math.round(calculoPrecioTotal.precioDescuentoCliente)}</p>
        <p><strong>Precio total:</strong> USD ${Math.ceil(calculoPrecioTotal.precioTotalFinal)}</p>
      `;
    } else {
      resultado += `
        <p><strong>Precio total:</strong> USD ${Math.ceil(calculoPrecioTotal.precioTotalFinal)}</p>
      `;
    }

    Swal.fire({
      title: 'Resultado',
      html: resultado,
      padding: '0 0 20px',
      showConfirmButton: false,
      showCloseButton: true,
      showClass: {
        popup: `animate__animated animate__zoomIn animate__fadeIn animate__faster`,
      },
      hideClass: {
        popup: `animate__animated animate__zoomOut animate__fadeOut animate__faster`,
      },
    });

    guardarSimulacionEnHistorial({
      origen,
      destino,
      distancia,
      kilogramos,
      empresa,
      clienteFrecuente,
      cantidadViajes: calculoPrecioTotal.cantidadViajes,
      preciosViajes: calculoPrecioTotal.preciosViajes,
      precioBaseFinal: calculoPrecioTotal.precioBaseFinal,
      precioDescuentoCliente: calculoPrecioTotal.precioDescuentoCliente,
      precioTotalFinal: calculoPrecioTotal.precioTotalFinal,
    });
  }
}

function guardarSimulacionEnHistorial(simulacion) {
  const historial = JSON.parse(sessionStorage.getItem('historialSimulaciones')) || [];
  historial.push(simulacion);
  sessionStorage.setItem('historialSimulaciones', JSON.stringify(historial));
}

document.getElementById('btnVerHistorial').addEventListener('click', mostrarHistorial);

function mostrarHistorial() {
  const historial = JSON.parse(sessionStorage.getItem('historialSimulaciones')) || [];

  if (historial.length === 0) {
    Swal.fire({
      icon: 'info',
      text: 'No hay simulaciones previas',
      padding: '0 0 40px',
      showConfirmButton: false,
      showCloseButton: true,
      showClass: {
        popup: `animate__animated animate__zoomIn animate__fadeIn animate__faster`,
      },
      hideClass: {
        popup: `animate__animated animate__zoomOut animate__fadeOut animate__faster`,
      },
    });
  } else {
    let tablaHTML = `
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; text-align: center;">
        <thead>
          <tr>
            <th>Origen</th>
            <th>Destino</th>
            <th>Distancia (Km)</th>
            <th>Peso (Kg)</th>
            <th>Empresa</th>
            <th>Cant. de viajes</th>
            <th>Precio por viaje</th>
            <th>Precio base</th>
            <th>Descuento</th>
            <th>Precio total</th>
          </tr>
        </thead>
        <tbody>
    `;

    historial.forEach((simulacion) => {
      let preciosViajes = '';

      if (simulacion.cantidadViajes === 1) {
        preciosViajes = `USD ${Math.ceil(simulacion.preciosViajes[0])}`;
      } else {
        preciosViajes = simulacion.preciosViajes
          .map((precio, index) => `<p>Viaje ${index + 1}: USD ${Math.ceil(precio)}</p>`)
          .join('');
      }

      const descuento =
        simulacion.precioDescuentoCliente > 0 ? `USD ${Math.round(simulacion.precioDescuentoCliente)}` : '-';

      tablaHTML += `
        <tr>
          <td>${simulacion.origen}</td>
          <td>${simulacion.destino}</td>
          <td>${simulacion.distancia}</td>
          <td>${simulacion.kilogramos}</td>
          <td>${simulacion.empresa}</td>
          <td>${simulacion.cantidadViajes}</td>
          <td>${preciosViajes}</td>
          <td>USD ${Math.ceil(simulacion.precioBaseFinal)}</td>
          <td>${descuento}</td>
          <td>USD ${Math.ceil(simulacion.precioTotalFinal)}</td>
        </tr>
      `;
    });

    tablaHTML += `
        </tbody>
      </table>
    `;

    Swal.fire({
      title: 'Historial de Simulaciones',
      html: tablaHTML,
      width: '80%',
      showConfirmButton: false,
      showCloseButton: true,
      showClass: {
        popup: `animate__animated animate__zoomIn animate__fadeIn animate__faster`,
      },
      hideClass: {
        popup: `animate__animated animate__zoomOut animate__fadeOut animate__faster`,
      },
    });
  }
}
