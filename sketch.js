let video; // Variable para el video capturado de la cámara
let handPose; // Modelo de ml5.js para detección de manos
let hands = []; // Almacena los datos de las manos detectadas
let painting; // Lienzo para dibujar
let px = 0; // Coordenada X previa del dedo
let py = 0; // Coordenada Y previa del dedo
let level = 1; // Nivel actual del juego
let instruction = "Dibuja un cuadrado"; // Instrucción para el usuario
let userDrawing = []; // Almacena los puntos del dibujo del usuario
let drawingThreshold = 50; // Número mínimo de puntos para evaluar un dibujo
let shapeDetected = false; // Indica si se detectó la figura correctamente

function preload() {
  handPose = ml5.handPose(); // Carga el modelo de detección de manos
}

function mousePressed() {
  console.log(hands); // Imprime los datos de las manos en consola
  //setTimeout(() => save("emitter.png"), 2000); // Guarda una imagen después de 2 segundos
}

function gotHands(results) {
  hands = results; // Actualiza los datos de las manos detectadas
}

function setup() {
  createCanvas(640, 480); // Crea el lienzo principal
  painting = createGraphics(640, 480); // Crea un lienzo para dibujar
  painting.clear(); // Limpia el lienzo

  video = createCapture(VIDEO); // Captura video de la cámara
  video.hide(); // Oculta el video original
  handPose.detectStart(video, gotHands); // Inicia la detección de manos con el video

  let clearButton = createButton("Borrar Lienzo"); // Botón para limpiar el lienzo
  clearButton.position(550, 540); // Posiciona el botón
  clearButton.mousePressed(clearCanvas); // Asigna la función para limpiar el lienzo
}

function clearCanvas() {
  painting.clear(); // Limpia el lienzo de dibujo
  userDrawing = []; // Reinicia el dibujo del usuario
  shapeDetected = false; // Resetea la detección de forma
}

function draw() {
  background(220); // Fondo gris claro
  image(video, 0, 0); // Muestra el video capturado

  textSize(24); // Tamaño del texto
  fill(0); // Color del texto (negro)
  text(`Nivel ${level}: ${instruction}`, 10, 30); // Muestra el nivel y la instrucción

  if (hands.length > 0) { // Si se detectaron manos
    let hand = hands[0]; // Obtiene la primera mano detectada
    let index = hand.index_finger_tip; // Punta del dedo índice
    let thumb = hand.thumb_tip; // Punta del pulgar
    let x = (index.x + thumb.x) * 0.5; // Promedio de X entre índice y pulgar
    let y = (index.y + thumb.y) * 0.5; // Promedio de Y entre índice y pulgar

    let d = dist(index.x, index.y, thumb.x, thumb.y); // Distancia entre índice y pulgar
    if (d < 20) { // Si los dedos están lo suficientemente cerca
      painting.stroke(255, 255, 0); // Color de trazo amarillo
      painting.strokeWeight(8); // Grosor del trazo
      painting.line(px, py, x, y); // Dibuja una línea entre el punto previo y el actual

      userDrawing.push(createVector(x, y)); // Almacena el punto actual en el dibujo del usuario
    }
    px = x; // Actualiza la coordenada previa X
    py = y; // Actualiza la coordenada previa Y
  }

  image(painting, 0, 0); // Muestra el lienzo de dibujo

  if (userDrawing.length > drawingThreshold && !shapeDetected) { // Si hay suficientes puntos para evaluar
    if (validateShape(userDrawing)) { // Verifica si el dibujo corresponde a la figura esperada
      shapeDetected = true; // Marca la figura como detectada
      setTimeout(levelUp, 1000); // Espera antes de pasar al siguiente nivel
    } else {
      shapeDetected = false; // Permite que el usuario siga intentando
    }
  }
}

function validateShape(points) {
  // Valida la figura en función del nivel actual
  switch (level) {
    case 1:
      return checkIfSquare(points); // Verifica si es un cuadrado
    case 2:
      return checkIfCircle(points); // Verifica si es un círculo
    case 3:
      return checkIfTriangle(points); // Verifica si es un triángulo
    default:
      return false; // Por defecto, no valida
  }
}

function checkIfSquare(points) {
  // Determina si los puntos forman un cuadrado
  let minX = width, maxX = 0, minY = height, maxY = 0;

  for (let v of points) {
    if (v.x < minX) minX = v.x; // Encuentra el mínimo X
    if (v.x > maxX) maxX = v.x; // Encuentra el máximo X
    if (v.y < minY) minY = v.y; // Encuentra el mínimo Y
    if (v.y > maxY) maxY = v.y; // Encuentra el máximo Y
  }

  let widthRect = maxX - minX; // Ancho del rectángulo
  let heightRect = maxY - minY; // Alto del rectángulo

  let aspectRatio = widthRect / heightRect; // Relación de aspecto

  return aspectRatio > 0.8 && aspectRatio < 1.2; // Comprueba si es casi un cuadrado
}

function checkIfCircle(points) {
  // Determina si los puntos forman un círculo
  let centerX = 0;
  let centerY = 0;
  for (let v of points) {
    centerX += v.x; // Suma las coordenadas X
    centerY += v.y; // Suma las coordenadas Y
  }
  centerX /= points.length; // Promedio de X
  centerY /= points.length; // Promedio de Y

  let totalDist = 0;
  for (let v of points) {
    totalDist += dist(v.x, v.y, centerX, centerY); // Suma distancias al centro
  }
  let avgDist = totalDist / points.length; // Distancia promedio

  let variance = 0;
  for (let v of points) {
    variance += abs(dist(v.x, v.y, centerX, centerY) - avgDist); // Calcula la variación
  }
  variance /= points.length;

  return variance < 15; // Tolerancia para considerar un círculo
}

function checkIfTriangle(points) {
  // Determina si los puntos forman un triángulo (lógica básica)
  if (points.length < 3) return false; // Necesita al menos 3 puntos
  let corners = [points[0], points[Math.floor(points.length / 2)], points[points.length - 1]];

  let a = dist(corners[0].x, corners[0].y, corners[1].x, corners[1].y); // Lado A
  let b = dist(corners[1].x, corners[1].y, corners[2].x, corners[2].y); // Lado B
  let c = dist(corners[2].x, corners[2].y, corners[0].x, corners[0].y); // Lado C

  return a + b > c && a + c > b && b + c > a; // Verifica la desigualdad triangular
}

function levelUp() {
  // Cambia al siguiente nivel
  level++;
  shapeDetected = false; // Reinicia la detección de forma
  userDrawing = []; // Limpia el dibujo del usuario
  painting.clear(); // Limpia el lienzo

  switch (level) {
    case 2:
      instruction = "Dibuja un círculo"; // Cambia la instrucción
      break;
    case 3:
      instruction = "Dibuja un triángulo"; // Cambia la instrucción
      break;
    default:
      instruction = "¡Has completado todos los niveles!"; // Mensaje de finalización
  }
}
