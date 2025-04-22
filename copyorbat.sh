#!/bin/bash

# Ruta de las carpetas donde se encuentran los directorios
base_dir="C:/Users/Public/Documents/SWORD6.22/exercises/Ejer_Riobamba/sessions/20250324T084101/checkpoints"

# Ruta de destino donde se debe copiar el orbat.xml (directorio raíz)
destination_dir="/c/Users/ESPE/Documents/proyectos/reportes"

# Este es el nombre del archivo orbat.xml
file_name="orbat.xml"

# Función para encontrar la última carpeta creada
get_last_created_folder() {
  # Buscar las carpetas ordenadas por la fecha de creación y tomar la última
  last_folder=$(ls -dt "$base_dir"/*/ | head -n 1)
  echo "$last_folder"
}

# Bucle infinito para verificar y copiar cada 10 segundos
while true; do
  # Encontrar la última carpeta creada
  last_folder=$(get_last_created_folder)
  last_folder=${last_folder%/}  # Eliminar la barra diagonal final si existe
  
  # Verificar la ruta del archivo
  echo "Ruta completa del archivo: $last_folder/$file_name"
  
  # Verificar si el archivo orbat.xml existe en la última carpeta
  if [ -f "$last_folder/$file_name" ]; then
    echo "Se encontró orbat.xml en: $last_folder"
    
    # Verificar si el archivo ya existe en la carpeta de destino
    if [ -f "$destination_dir/$file_name" ]; then
      # Si el archivo ya existe, solo copiar el contenido
      cat "$last_folder/$file_name" > "$destination_dir/$file_name"
      echo "Contenido de orbat.xml actualizado en $destination_dir."
    else
      # Si el archivo no existe, copiarlo directamente
      cp "$last_folder/$file_name" "$destination_dir/"
      echo "Archivo copiado a la raíz de $destination_dir."
    fi
  else
    echo "No se encontró orbat.xml en la última carpeta."
  fi

  # Esperar 10 segundos antes de verificar nuevamente
  sleep 10
done
