import React, { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Printer, Plus, Trash2, Send, UploadCloud, Phone } from "lucide-react";

export default function Cotizador() {
  const [productosDb, setProductosDb] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cotizacion, setCotizacion] = useState([]);

  // Estados para WhatsApp y Drag & Drop
  const [archivoPdf, setArchivoPdf] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const componentRef = useRef(null);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        // Hacemos la petición a la API de FastAPI
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/productos`
        );

        if (!response.ok) {
          throw new Error("Error al obtener los productos");
        }

        const data = await response.json();
        setProductosDb(data); // data ya vendrá con el formato de tu BD
      } catch (error) {
        console.error("Hubo un problema con la petición:", error);
      }
    };

    fetchProductos();
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "Cotizacion_Productos",
  });

  const agregarProducto = (producto) => {
    const existe = cotizacion.find(
      (item) => item.id_producto === producto.id_producto
    );
    if (existe) {
      setCotizacion(
        cotizacion.map((item) =>
          item.id_producto === producto.id_producto
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
    } else {
      setCotizacion([...cotizacion, { ...producto, cantidad: 1 }]);
    }
  };

  const eliminarProducto = (id) => {
    setCotizacion(cotizacion.filter((item) => item.id_producto !== id));
  };

  const modificarPrecio = (id, nuevoPrecio) => {
    setCotizacion(
      cotizacion.map((item) =>
        item.id_producto === id
          ? {
              ...item,
              // Permitimos que esté vacío temporalmente mientras el usuario borra/escribe
              precio_venta: nuevoPrecio === "" ? "" : Number(nuevoPrecio),
            }
          : item
      )
    );
  };

  const calcularTotal = () => {
    return cotizacion.reduce(
      // Usamos Number() y || 0 por si el usuario borra todo el input y queda vacío
      (total, item) => total + (Number(item.precio_venta) || 0) * item.cantidad,
      0
    );
  };

  const productosFiltrados = productosDb.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.codigo_interno &&
        p.codigo_interno.toLowerCase().includes(busqueda.toLowerCase()))
  );

  // --- LOGICA DRAG & DROP ---
  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        setArchivoPdf(file);
      } else {
        alert("Por favor, sube solo archivos PDF.");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setArchivoPdf(e.target.files[0]);
    }
  };

  // --- LOGICA COMPARTIR ---
  const compartirCotizacion = async () => {
    if (!archivoPdf) {
      alert(
        "Por favor, sube o arrastra el archivo PDF de la cotización primero."
      );
      return;
    }

    // Si el navegador soporta compartir archivos nativamente (Ej: Móviles, Safari, Edge moderno)
    if (navigator.canShare && navigator.canShare({ files: [archivoPdf] })) {
      try {
        await navigator.share({
          files: [archivoPdf],
          title: "Cotización",
          text: "adjunto la cotización solicitada.",
        });
      } catch (error) {
        console.log("Error compartiendo:", error);
      }
    } else {
      // Fallback para PC (Chrome/Firefox antiguo) que no soporte compartir archivos nativamente
      alert(
        "Tu navegador no soporta compartir archivos directamente. Se abrirá WhatsApp Web para que lo adjuntes manualmente."
      );
      window.open("https://web.whatsapp.com/", "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-[#8B1E2D] p-8 font-sans text-white print:bg-white print:p-0">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 print:block">
        {/* PANEL IZQUIERDO: Búsqueda y Selección */}
        {/* Agregamos print:hidden para que todo el catálogo desaparezca en el PDF */}
        <div className="md:col-span-1 bg-[#2F2F2F] p-6 rounded-lg shadow-xl h-fit print:hidden">
          <h2 className="text-xl font-bold mb-4">Catálogo de Productos</h2>
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            className="w-full p-2 mb-4 rounded bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-[#D32F2F]"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {productosFiltrados.map((prod) => (
              <div
                key={prod.id_producto}
                className="bg-gray-800 p-3 rounded flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-sm">{prod.nombre}</p>
                  <p className="text-xs text-gray-400">
                    Cod: {prod.codigo_interno} | ${prod.precio_venta}
                  </p>
                </div>
                <button
                  onClick={() => agregarProducto(prod)}
                  className="bg-[#D32F2F] hover:bg-red-800 p-2 rounded text-white transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* PANEL DERECHO: Vista de Cotización y Envío */}
        <div className="md:col-span-2 flex flex-col gap-4">
          {/* BOTÓN IMPRIMIR */}
          {/* Agregamos print:hidden porque no queremos imprimir el botón de imprimir */}
          <div className="flex justify-end gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="bg-[#D32F2F] hover:bg-red-800 px-4 py-2 rounded flex items-center gap-2 font-bold transition-colors shadow-lg"
            >
              <Printer size={20} />
              1. Imprimir / Descargar PDF
            </button>
          </div>

          {/* PANEL DE COMPARTIR */}
          {/* Agregamos print:hidden para ocultar la zona de Drag&Drop y el botón de WhatsApp */}
          <div className="bg-[#2F2F2F] p-6 rounded-lg shadow-xl flex flex-col gap-4 items-center print:hidden">
            <div
              className={`w-full border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${isDragging ? "border-[#D32F2F] bg-red-900/20" : "border-gray-500 hover:border-gray-400 bg-gray-800"}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => document.getElementById("fileUpload").click()}
            >
              <input
                id="fileUpload"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <UploadCloud
                size={32}
                className={`mx-auto mb-2 ${archivoPdf ? "text-green-400" : "text-gray-400"}`}
              />
              {archivoPdf ? (
                <p className="text-green-400 font-semibold">
                  {archivoPdf.name}
                </p>
              ) : (
                <p className="text-gray-400 text-sm">
                  Arrastra aquí el PDF descargado o haz clic para subirlo
                </p>
              )}
            </div>

            <button
              onClick={compartirCotizacion}
              className="bg-green-600 hover:bg-green-700 w-full py-3 rounded flex items-center justify-center gap-2 font-bold transition-colors shadow-lg"
            >
              <Send size={20} />
              2. Compartir Cotización
            </button>
          </div>

          {/* Contenedor Ref para el PDF */}
          <div
            ref={componentRef}
            // Agregué print:shadow-none y print:w-full para limpiar estilos extra en el PDF
            className="bg-[#2F2F2F] p-4 md:p-8 rounded-lg shadow-xl print:text-black print:bg-white print:shadow-none print:w-full print:m-0"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-center p-3 md:p-5">
              Herrajes Tiscareño
            </h1>
            <div className="border-b border-gray-600 print:border-gray-300 pb-4 mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-2">
              <div>
                <h2 className="text-xl md:text-2xl font-bold">COTIZACIÓN</h2>
                <p className="text-gray-400 print:text-gray-600 mt-1">
                  Fecha: {new Date().toLocaleDateString("es-MX")}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto w-full print:overflow-visible">
              <table className="w-full text-left border-collapse min-w-[600px] print:min-w-full">
                <thead>
                  <tr className="border-b border-gray-600 print:border-gray-300">
                    <th className="py-3 px-2">Cód.</th>
                    <th className="py-3 px-2">Descripción</th>
                    <th className="py-3 px-2 text-center">Cant.</th>
                    <th className="py-3 px-2 text-center">P.Unitario</th>
                    <th className="py-3 px-2 text-right">Subtotal</th>
                    <th className="py-3 px-2 print:hidden"></th>
                  </tr>
                </thead>
                <tbody>
                  {cotizacion.map((item) => (
                    <tr
                      key={item.id_producto}
                      className="border-b border-gray-700 print:border-gray-200"
                    >
                      <td className="py-3 px-2 text-sm whitespace-nowrap">
                        {item.codigo_interno}
                      </td>
                      <td className="py-3 px-2 min-w-[150px]">{item.nombre}</td>
                      <td className="py-3 px-2 text-center">{item.cantidad}</td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="print:hidden">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.precio_venta}
                            onChange={(e) =>
                              modificarPrecio(item.id_producto, e.target.value)
                            }
                            className="w-20 md:w-24 p-1 rounded bg-gray-800 border border-gray-600 text-right focus:outline-none focus:border-[#D32F2F] print:hidden"
                          />
                        </div>
                        <span className="hidden print:inline">
                          ${item.precio_venta}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right whitespace-nowrap">
                        $
                        {(
                          (Number(item.precio_venta) || 0) * item.cantidad
                        ).toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-right print:hidden">
                        <button
                          onClick={() => eliminarProducto(item.id_producto)}
                          className="text-gray-400 hover:text-[#D32F2F] transition-colors p-1"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {cotizacion.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center py-8 text-gray-500"
                      >
                        No hay productos en la cotización.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex justify-end">
              <div className="bg-gray-800 print:bg-transparent print:p-0 p-4 rounded-lg w-full md:w-auto min-w-[250px]">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>TOTAL:</span>
                  <span>${calcularTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
