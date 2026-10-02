$(document).ready(function() {

    // =========================================================================
    // 0. CONFIGURACIÓN GLOBAL
    // =========================================================================

    // =========================================================================
    // 1. LÓGICA DE LA TABLA PRINCIPAL (VISTA DE CONSOLIDADO Y ACTUALIZACIÓN)
    // =========================================================================
    
    // Inicializamos la tabla principal solo si existe en el DOM
    if ($('#tablaMain').length > 0) {
        // Indica si el admin eligió una dependencia concreta en el datalist.
        // Con la opción "todos" la tabla es un consolidado de varias dependencias,
        // así que no se puede modificar: se actualizaría el requerimiento equivocado.
        function hayDependenciaElegida() {
            var seleccion = $('#select-dependencia').val();
            return seleccion !== '' && seleccion !== undefined && seleccion !== 'todos';
        }

        const tabla = $('#tablaMain').DataTable({
            ajax: {
                url: "?url=requerimiento&type=main",
                method: 'POST',
                data: function(d) {
                    d.getAll = true;
                    d.id_dep_filtro = $('#id_dep_seleccionado').val(); // Enviamos la dependencia seleccionada
                },
                // Extraemos el id_req de forma dinámica cuando llegan los datos del servidor
                dataSrc: function(json) {
                    idReq = 0;
                    var hayDatos = (json.data && json.data.length > 0);
                
                    if (hayDatos) {
                        // Lógica de ID (la que ya tenías)
                        for (var i = 0; i < json.data.length; i++) {
                            if (json.data[i].id_req && json.data[i].id_req > 0) {
                                idReq = json.data[i].id_req;
                                break; 
                            }
                        }
                
                        // Ocultar botón modificar al recargar datos; solo aparece al modificar un input
                        $('#btn-modificar').hide();

                        if (esAdmin && hayDependenciaElegida()) {
                            $('#btn-eliminar').show();
                        } else {
                            $('#btn-eliminar').hide();
                        }
                        // Con la opción "todos" el consolidado no es modificable
                        if (!hayDependenciaElegida()) {
                            $('#btn-modificar-modal').hide().prop('disabled', true);
                        }
                        // Lógica para Enviar Definitivo
                        if (esAdmin) {
                            $('#btn-cambiar-estado').hide(); // El admin NUNCA ve el botón de enviar
                        } else {
                            $('#btn-cambiar-estado').show(); // El usuario normal SÍ lo ve
                        }
                    } else {
                        // Si no hay datos, ocultar el botón modificar
                        $('#btn-modificar').hide();
                        $('#btn-eliminar').hide();
                        $('#btn-cambiar-estado').hide();
                    }
                    
                    return json.data;
                }
            },
            columns: [
                { data: 'dependencia' },
                { data: 'partida' },
                { data: 'producto' },
                { data: 'Ene', render: function(data, type, row) { return loadData(data, row, 1); }},
                { data: 'Feb', render: function(data, type, row) { return loadData(data, row, 2); }},
                { data: 'Mar', render: function(data, type, row) { return loadData(data, row, 3); }},
                { data: 'Abr', render: function(data, type, row) { return loadData(data, row, 4); }},
                { data: 'May', render: function(data, type, row) { return loadData(data, row, 5); }},
                { data: 'Jun', render: function(data, type, row) { return loadData(data, row, 6); }},
                { data: 'Jul', render: function(data, type, row) { return loadData(data, row, 7); }},
                { data: 'Ago', render: function(data, type, row) { return loadData(data, row, 8); }},
                { data: 'Sep', render: function(data, type, row) { return loadData(data, row, 9); }},
                { data: 'Oct', render: function(data, type, row) { return loadData(data, row, 10); }},
                { data: 'Nov', render: function(data, type, row) { return loadData(data, row, 11); }},
                { data: 'Dic', render: function(data, type, row) { return loadData(data, row, 12); }},
                { data: 'precio_unit_usd', visible: esAdmin ,render: $.fn.dataTable.render.number(',', '.', 2, '$') },
                { data: 'Total_Cantidad'},
                { data: 'total_usd', visible: esAdmin, render: $.fn.dataTable.render.number(',', '.', 2, '$')  },
                { data: 'total_bs', visible: esAdmin , render: $.fn.dataTable.render.number(',', '.', 2, 'Bs ') }
                
            ],
            
            order: [[16, 'desc']],
            autowidth: false,
            responsive: true,
            pageLength: 25,
            language: {
                url: "assets/js/DataTables/spanish.json"
            },
            footerCallback: function (row, data, start, end, display) {
                var api = this.api();
        
                // Función auxiliar para convertir a número limpio
                var intVal = function (i) {
                    return typeof i === 'string' ? i.replace(/[\$,]/g, '') * 1 : typeof i === 'number' ? i : 0;
                };
        
                // Índices de columna (0-indexed): 
                // 15 = precio_unit_usd (visible: esAdmin)
                // 16 = Total_Cantidad (siempre visible)
                // 17 = total_usd (visible: esAdmin)
                // 18 = total_bs (visible: esAdmin)
                var colCant = 16;
                var colUsd = 17; 
                var colBs = 18;
        
                // Sumamos el Total de Cantidad (siempre visible)
                var totalCant = api.column(colCant).data().reduce(function (a, b) {
                    return intVal(a) + intVal(b);
                }, 0);
        
                // Opciones para asegurar que siempre haya 2 decimales
                var formatoMoneda = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
        
                // Aplicamos el formato con comas a los resultados
                $(api.column(colCant).footer()).html(totalCant.toLocaleString( 'es-CO'));
        
                if (esAdmin) {
                    // Sumamos el Total de USD
                    var totalUsd = api.column(colUsd).data().reduce(function (a, b) {
                        return intVal(a) + intVal(b);
                    }, 0);
        
                    // Sumamos el Total de Bs
                    var totalBs = api.column(colBs).data().reduce(function (a, b) {
                        return intVal(a) + intVal(b);
                    }, 0);
        
                    // Aplicamos el formato con comas a los resultados
                    $(api.column(colUsd).footer()).html('$' + totalUsd.toLocaleString('en-US', formatoMoneda));
                    $(api.column(colBs).footer()).html('Bs ' + totalBs.toLocaleString('en-US', formatoMoneda));
                }
            }
            
        });
        

        $('#select-dependencia').on('input change', function() {
            var selectedName = $(this).val();
            var selectedId = 0;
            $('#select-dep-list option').each(function() {
                if ($(this).val() === selectedName) {
                    selectedId = $(this).data('id_dep');
                    return false; // break
                }
            });
            $('#id_dep_seleccionado').val(selectedId);
            // Si se elige "todos" o se limpia el datalist, el consolidado no es modificable
            if (!hayDependenciaElegida()) {
                $('#btn-modificar-modal').hide().prop('disabled', true);
            }
            if(selectedName !== "") {
                tabla.ajax.reload();
            } else {
                // Si no hay nada seleccionado, limpiamos la tabla
                tabla.clear().draw();
            }
        })

        // =========================================================================
        // TOGGLE VISTA MODAL (Admin)
        // =========================================================================

        $('#modalViewToggle').on('change', function() {
            var isChecked = $(this).prop('checked');
            
            if (isChecked) {
                // Ocultar columnas de meses (índices 3-14) en la tabla principal
                for (var i = 3; i <= 14; i++) {
                    tabla.column(i).visible(false);
                }
                // Ocultar botón modificar de la vista principal
                $('#btn-modificar').hide();
                $('#btn-ver-cantidades').show();
                // Ocultar modal si estaba abierto
                $('#modalCantidades').hide();
                $('#btn-modificar-modal').hide().prop('disabled', true);
            } else {
                // Mostrar columnas de meses
                for (var i = 3; i <= 14; i++) {
                    tabla.column(i).visible(true);
                }
                // Mostrar botón modificar de la vista principal
                $('#btn-modificar').show();
                $('#btn-ver-cantidades').hide();
                $('#modalCantidades').hide();
                $('#btn-modificar-modal').hide().prop('disabled', true);
                // Recargar datos para que se muestren los inputs
                tabla.ajax.reload(null, false);
            }
        });

        // =========================================================================
        // BOTÓN VER CANTIDADES (abrir modal)
        // =========================================================================

        $('#btn-ver-cantidades').on('click', function() {
            openModal();
        });

        // =========================================================================
        // FUNCIÓN PARA ABRIR MODAL CON CANTIDADES
        // =========================================================================

        function openModal() {
            // Destruir DataTable anterior si existe para reconstruir
            if ($.fn.DataTable.isDataTable('#tablaModalCantidades')) {
                $('#tablaModalCantidades').DataTable().destroy();
            }
            $('#tablaModalCantidades tbody').empty();

            var rowsData = tabla.rows().data().toArray();
            var monthKeys = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                             'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

            // Valores originales por id_prod, usados para serializar al guardar
            var cantidadesOriginales = {};
            rowsData.forEach(function(row) {
                var idProd = row.id_prod;
                cantidadesOriginales[idProd] = {};
                for (var m = 1; m <= 12; m++) {
                    cantidadesOriginales[idProd][m] = Number(row[monthKeys[m - 1]]) || 0;
                }
            });

            // Cambios hechos por el usuario, sobreviven al cambio de página
            var cantidadesModificadas = {};

            function createInput(idProd, mes, valorOriginal) {
                var name = 'cantidades[' + idProd + '][' + mes + ']';
                var value = cantidadesModificadas.hasOwnProperty(name)
                    ? cantidadesModificadas[name]
                    : valorOriginal;
                return '<input type="number" name="' + name + '" min="0" value="' + value + '">';
            }

            function mesColumn(mes) {
                return {
                    data: monthKeys[mes - 1],
                    render: function(data, type, row) {
                        return createInput(row.id_prod, mes, data);
                    }
                };
            }

            $('#tablaModalCantidades').DataTable({
                data: rowsData,
                deferRender: true,
                pageLength: 25,
                lengthChange: true,
                lengthMenu: [10, 25, 50, 100],
                searching: true,
                pagingType: 'simple_numbers',
                ordering: false,
                info: true,
                autoWidth: false,
                dom: '<"top"lfrt>rt<"bottom"ip>',
                language: {
                    url: "assets/js/DataTables/spanish.json",
                    search: "Buscar:",
                    lengthMenu: "Mostrar _MENU_ registros",
                    info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
                    paginate: { first: "Primero", last: "Último", next: "Siguiente", previous: "Anterior" }
                },
                columns: [
                    { data: 'dependencia' },
                    { data: 'producto' },
                    mesColumn(1),  mesColumn(2),  mesColumn(3),  mesColumn(4),
                    mesColumn(5),  mesColumn(6),  mesColumn(7),  mesColumn(8),
                    mesColumn(9),  mesColumn(10), mesColumn(11), mesColumn(12)
                ],
                columnDefs: [
                    { "orderable": false, "targets": "_all" }
                ]
            });

            // Event delegation: los inputs se crean de forma diferida con deferRender
            $('#tablaModalCantidades tbody').off('input', 'input[type="number"]').on('input', 'input[type="number"]', function() {
                cantidadesModificadas[$(this).attr('name')] = $(this).val();
                // Solo se habilita la modificación con una dependencia concreta seleccionada
                if (hayDependenciaElegida()) {
                    $('#btn-modificar-modal').prop('disabled', false).show();
                }
            });

            $('#btn-modificar-modal').off('click').on('click', function(e) {
                e.preventDefault();
                var btn = $(this);
                var textoOriginal = btn.text();
                btn.prop('disabled', true).text('Guardando...');

                // Serializar desde los datos originales + las modificaciones del usuario
                var partes = [];
                Object.keys(cantidadesOriginales).forEach(function(idProd) {
                    for (var mes = 1; mes <= 12; mes++) {
                        var name = 'cantidades[' + idProd + '][' + mes + ']';
                        var valor = cantidadesModificadas.hasOwnProperty(name)
                            ? cantidadesModificadas[name]
                            : cantidadesOriginales[idProd][mes];
                        if (Number(valor) > 0) {
                            partes.push(name + '=' + encodeURIComponent(valor));
                        }
                    }
                });
                var dataEnviar = partes.join('&') + '&actualizarMatriz=true&id_req=' + idReq;

                $.ajax({
                    url: '?url=requerimiento&type=main',
                    type: 'POST',
                    data: dataEnviar,
                    dataType: 'json',
                    success: function(respuesta) {
                        if(respuesta.status === 'success') {
                            alert("Los datos han sido modificados y guardados exitosamente.");
                            cantidadesModificadas = {};
                            tabla.ajax.reload(null, false);
                            // No se oculta el modal tras el éxito
                            $('#btn-modificar-modal').prop('disabled', true).text(textoOriginal).hide();
                        } else {
                            alert("Error en el servidor: " + respuesta.message);
                            btn.prop('disabled', false).text(textoOriginal);
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error(xhr.responseText);
                        alert("Ocurrió un error de conexión al intentar actualizar los datos.");
                        btn.prop('disabled', false).text(textoOriginal);
                    }
                });
            });

            $('#modalCantidades').show();
            // El botón Modificar solo aparece si hay una dependencia concreta elegida
            if (hayDependenciaElegida()) {
                $('#btn-modificar-modal').show().prop('disabled', true);
            } else {
                $('#btn-modificar-modal').hide().prop('disabled', true);
            }
        }

        // =========================================================================
        // CERRAR MODAL
        // =========================================================================

        $('#btnCerrarModal').on('click', function() {
            $('#modalCantidades').hide();
            $('#btn-modificar-modal').hide().prop('disabled', true);
        });

        // Cerrar modal al hacer clic fuera del panel
        $('#modalCantidades').on('click', function(e) {
            if (e.target === this) {
                $(this).hide();
                $('#btn-modificar-modal').hide().prop('disabled', true);
            }
        });

        function loadData(data, row, mes) {
            return `<input type="number" 
                           style="width: 55px; padding: 8px 5px; font-size: 14px; text-align: center; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; outline: none; transition: border-color 0.2s ease;" 
                           name="cantidades[${row.id_prod}][${mes}]"
                           min="0" 
                           value="${data}">`;
        }
        // console.log(esAdmin);
        $('#btn-modificar').prop('disabled', true);

        // Detectar cualquier cambio en los inputs para habilitar y mostrar el botón de envío
        $('#tablaMain').on('input', 'input[type="number"]', function() {
            $('#btn-modificar').prop('disabled', false).show();
        });

        // Forzar actualización del id_req si el usuario hace clic directo en "Modificar"
        // $('#tablaMain').on('click', '.btn-modificar', function() {
        //     var idClick = $(this).data('id');
        //     idReq = idClick;
        //     $('#btn-modificar').prop('disabled', false);
        // });

        // Enviar actualización matriz a la base de datos
        $('#btn-modificar').on('click', function(e) {
            e.preventDefault(); 

            var btn = $(this);
            var textoOriginal = btn.text();
            
            btn.prop('disabled', true).text('Guardando...');

            var datosInputs = tabla.$('input').serialize(); 
            var dataEnviar = datosInputs + '&actualizarMatriz=true&id_req=' + idReq;

            $.ajax({
                url: '?url=requerimiento&type=main',
                type: 'POST',
                data: dataEnviar,
                dataType: 'json',
                success: function(respuesta) {
                    if(respuesta.status === 'success') {
                        alert("Los datos han sido modificados y guardados exitosamente.");
                        tabla.ajax.reload(null, false); 
                        
                        // Volvemos a deshabilitar el botón hasta que haya un nuevo cambio
                        $('#btn-modificar').prop('disabled', true);
                        $('#btn-modificar').text(textoOriginal);
                    } else {
                        alert("Error en el servidor: " + respuesta.message + idReq);
                        btn.prop('disabled', false).text(textoOriginal);
                    }
                },
                error: function(xhr, status, error) {
                    console.error(xhr.responseText);
                    console.error(error);
                    alert("Ocurrió un error de conexión al intentar actualizar los datos.");
                    btn.prop('disabled', false).text(textoOriginal);
                }
            });
        });

        $('#btn-eliminar').on('click', function(e) {
            e.preventDefault();

            if (!idReq || idReq <= 0) {
                alert("No hay un requerimiento seleccionado.");
                return;
            }

            // 🟢 Confirmación antes de eliminar
            if (!confirm("¿Está seguro de eliminar este requerimiento? Esta acción no se puede deshacer.")) {
                return;
            }

            var btn = $(this);
            var textoOriginal = btn.text();
            btn.prop('disabled', true).text('Eliminando...');

            $.ajax({
                url: '?url=requerimiento&type=main',
                type: 'POST',
                data: {
                    eliminarRequerimiento: true,
                    id_req: idReq
                },
                dataType: 'json',
                success: function(respuesta) {
                    if (respuesta.status === 'success') {
                        alert(respuesta.message || "Requerimiento eliminado correctamente.");
                        // Recargamos la tabla para reflejar los cambios (el requerimiento ya no aparecerá)
                        tabla.ajax.reload(null, false);
                    } else {
                        alert("Error: " + respuesta.message);
                    }
                },
                error: function(xhr, status, error) {
                    console.error(xhr.responseText);
                    alert("Ocurrió un error en la comunicación con el servidor.");
                },
                complete: function() {
                    btn.prop('disabled', false).text(textoOriginal);
                }
            });
        });
    }
    // Lógica para cambiar estado de 1 a 0
    $('#btn-cambiar-estado').on('click', function(e) {
        e.preventDefault();
        
        if(!idReq || idReq <= 0) {
            alert("No hay un requerimiento seleccionado.");
            return;
        }

        if(confirm("¿Estás seguro de enviar el requerimiento definitivamente?")) {
            $.ajax({
                url: '?url=requerimiento&type=main',
                type: 'POST',
                data: { 
                    cambiarEstado: true, 
                    id_req: idReq 
                },
                dataType: 'json',
                success: function(respuesta) {
                    if(respuesta.status === 'success') {
                        alert("Estado actualizado exitosamente.");
                        // Recargamos la tabla para que se reflejen los cambios visuales
                        $('#tablaMain').DataTable().ajax.reload(null, false);
                    } else {
                        alert("Error: " + respuesta.message);
                    }
                },
                error: function(e) {
                    alert("Ocurrió un error en la comunicación con el servidor.");
                    console.log(e);
                }
            });
        }
    });

    // =========================================================================
    // 2. LÓGICA DE LA TABLA DE REGISTRO (CREACIÓN DE NUEVOS REQUERIMIENTOS)
    // =========================================================================
    
    const currentURL = "?url=requerimiento&type=register";

    // Inicializamos tablaRegistro solo si estamos en la vista de registro
    if ($('#tabla-registro').length > 0) {
        
        const tablaRegistro = $('#tabla-registro').DataTable({
            serverSide: false,
            ajax: {
                url: currentURL,
                type: "POST",
                data: function(d) {
                    d.getProductos = true;
                    d.partida = $('#partida_actual').val();
                }
            },
            columns: [
                { data: 'nom_prod' },
                { data: "ene", render: function(data, type, row) { return crearInput(row.id_prod, 1, data); }},
                { data: "feb", render: function(data, type, row) { return crearInput(row.id_prod, 2, data); }},
                { data: "mar", render: function(data, type, row) { return crearInput(row.id_prod, 3, data); }},
                { data: "abr", render: function(data, type, row) { return crearInput(row.id_prod, 4, data); }},
                { data: "may", render: function(data, type, row) { return crearInput(row.id_prod, 5, data); }},
                { data: "jun", render: function(data, type, row) { return crearInput(row.id_prod, 6, data); }},
                { data: "jul", render: function(data, type, row) { return crearInput(row.id_prod, 7, data); }},
                { data: "ago", render: function(data, type, row) { return crearInput(row.id_prod, 8, data); }},
                { data: "sep", render: function(data, type, row) { return crearInput(row.id_prod, 9, data); }},
                { data: "oct", render: function(data, type, row) { return crearInput(row.id_prod, 10, data); }},
                { data: "nov", render: function(data, type, row) { return crearInput(row.id_prod, 11, data); }},
                { data: "dic", render: function(data, type, row) { return crearInput(row.id_prod, 12, data); }}
            ],
            ordering: false,
            responsive: true,
            pageLength: 25,
            language: {
                url: "assets/js/DataTables/spanish.json"
            }
        });

        function crearInput(id_prod, mes, valor_actual) {
            return '<input type="number" name="cantidades['+id_prod+']['+mes+']" value="'+valor_actual+'" min="0" class="form-control form-control-sm text-center" style="width: 60px;">';
        }

        // Guardar la partida y avanzar
        $('#btn-guardar').click(function() {
            var btn = $(this);
            btn.prop('disabled', true).text('Guardando partida...');

            let datosInputs = tablaRegistro.$('input').serialize(); 
            let partidaActual = $('#partida_actual').val();

            let dataEnviar = datosInputs + '&guardarPartida=true&id_req=' + idReq + '&partida_actual=' + partidaActual;

            $.ajax({
                url: currentURL,
                type: 'POST',
                data: dataEnviar,
                dataType: 'json',
                success: function(respuesta) {
                    if(respuesta.status === 'success') {
                        idReq = respuesta.id_req;
                        
                        if(respuesta.siguiente_partida === 'FINAL') {
                            $('#btn-guardar').addClass('d-none');
                            alert("Todas las partidas han sido guardadas en borrador de manera exitosa.");
                            window.location.href = "?url=requerimiento&type=main";
                        } else {
                            $('#partida_actual').val(respuesta.siguiente_partida);
                            $('#titulo-partida').text(respuesta.siguiente_partida);
                            tablaRegistro.ajax.reload(null, false);
                        }
                    } else {
                        console.log("Error en el servidor: " + respuesta.message);
                        window.location.href = "?url=requerimiento&type=main";
                    }
                },
                error: function(xhr, status, error) {
                    console.error(xhr.responseText);
                    alert("Ocurrió un error en la comunicación de datos.");
                },
                complete: function() {
                    if($('#partida_actual').val() !== 'FINAL') {
                        btn.prop('disabled', false).text('Guardar y Avanzar a Siguiente Partida');
                    }
                }
            });
        });
    }
});
