#!/bin/bash

# Ruta base donde están las sesiones
base_dir="C:/Users/Public/Documents/SWORD6.22/exercises/Ejer_Riobamba/sessions"

# Ruta de destino donde se debe copiar el orbat.xml
destination_dir="/c/Users/ESPE/Documents/proyectos/reportes"

# Nombre del archivo
file_name="orbat.xml"

# Función para obtener la última carpeta creada en un directorio
get_last_created_folder() {
  parent_dir="$1"
  last_folder=$(ls -dt "$parent_dir"/*/ 2>/dev/null | head -n 1)
  echo "$last_folder"
}

# Bucle infinito
while true; do
  # Paso 1: Buscar última carpeta en sessions
  last_session=$(get_last_created_folder "$base_dir")
  last_session=${last_session%/}

  # Paso 2: Dentro de esa sesión, buscar checkpoints
  checkpoints_dir="$last_session/checkpoints"

  # Paso 3: Buscar la última carpeta creada en checkpoints
  last_checkpoint=$(get_last_created_folder "$checkpoints_dir")
  last_checkpoint=${last_checkpoint%/}

  # Paso 4: Ruta completa del archivo
  file_path="$last_checkpoint/$file_name"
  echo "Ruta completa del archivo: $file_path"

  # Verificar si existe
  if [ -f "$file_path" ]; then
    echo "Se encontró orbat.xml en: $last_checkpoint"

    if [ -f "$destination_dir/$file_name" ]; then
      cat "$file_path" > "$destination_dir/$file_name"
      echo "Contenido de orbat.xml actualizado en $destination_dir."
    else
      cp "$file_path" "$destination_dir/"
      echo "Archivo copiado a la raíz de $destination_dir."
    fi
  else
    echo "No se encontró orbat.xml en $last_checkpoint"
  fi

  # Esperar 10 segundos
  sleep 10
done
