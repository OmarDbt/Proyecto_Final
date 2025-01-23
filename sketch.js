let video;
let handPose;
let hands = [];
let painting;
let px = 0;
let py = 0;
let sw = 8;
let currentColor;
let colors; //Paleta
let showStartScreen = true;  // Pantalla de inicio

function preload() {
  // Carga el modelo de detección de manos de ml5.js
  handPose = ml5.handPose({ flipped: true });
}

function gotHands(results) {
  hands = results; // Actualiza la variable 'hands' con los resultados de la detección de manos
}

function setup() {
  createCanvas(640, 480);  // Crea el lienzo de 640x480 (igual que el video)
  painting = createGraphics(640, 480); // Lienzo adicional para el dibujo
  painting.clear(); // Limpia el lienzo inicialmente

  video = createCapture(VIDEO);  // Captura el video desde la cámara
  video.hide();  // Esconde el video, para dibujar solo el lienzo
  handPose.detectStart(video, gotHands);  // Comienza la detección de manos en el video

  // Define una paleta de colores
  colors = [
    color(0, 0, 0), //  Negro
    color(255, 255, 255), // Blanco
    color(0, 0, 255), // Azul
    color(255, 0, 0), // Rojo
  ];
  currentColor = colors[0]; // Color inicial de trazo

  // Llama al botón de borrar desde el HTML y asigna la acción
  const clearButton = document.getElementById('clearButton');
  clearButton.addEventListener('click', () => {
    painting.clear();  // Borra todo lo dibujado en el lienzo
  });

  // Desaparece la pantalla de inicio después de 5 segundos
  setTimeout(() => {
    showStartScreen = false; // Desactiva la pantalla de inicio
    document.getElementById('startScreen').style.display = 'none'; // Oculta la pantalla de inicio
  }, 5000);
}

function draw() {
  if (showStartScreen) {
    background(0);  // Si la pantalla de inicio está activa, no dibuja nada más
  } else {
    image(video, 0, 0);  // Dibuja el video en el lienzo de fondo

    // Dibuja la paleta de colores en el lado izquierdo
    for (let i = 0; i < colors.length; i++) {
      fill(colors[i]);
      noStroke();
      circle(30, 50 + i * 60, 50);  // Círculos para los colores de la paleta
    }

    if (hands.length > 0) {  // Si hay manos detectadas
      let rightHand, leftHand;
      // Recorre las manos detectadas y asigna la información de la mano derecha e izquierda
      for (let hand of hands) {
        if (hand.handedness == 'Right') {
          let index = hand.index_finger_tip; // Punta del dedo índice
          let thumb = hand.thumb_tip; // Punta del pulgar
          rightHand = { index, thumb };
        }
        if (hand.handedness == 'Left') {
          let index = hand.index_finger_tip;
          let thumb = hand.thumb_tip;
          leftHand = { index, thumb };
        }
      }

      // Mano izquierda para cambiar el tamaño del pincel
      if (leftHand) {
        let { index, thumb } = leftHand;
        let x = (index.x + thumb.x) * 0.5;
        let y = (index.y + thumb.y) * 0.5;
        sw = dist(index.x, index.y, thumb.x, thumb.y);  // Calcula el tamaño del pincel según la distancia entre el índice y el pulgar
        fill(255, 0, 255);
        noStroke();
        circle(x, y, sw);  // Dibuja un círculo donde se encuentran los dedos
      }

      // Mano derecha para dibujar y seleccionar colores
      if (rightHand) {
        let { index, thumb } = rightHand;
        let x = (index.x + thumb.x) * 0.5;
        let y = (index.y + thumb.y) * 0.5;

        // Si el índice pasa sobre la paleta de colores, cambia el color de trazo
        for (let i = 0; i < colors.length; i++) {
          let colorX = 30;
          let colorY = 50 + i * 60;
          if (dist(index.x, index.y, colorX, colorY) < 20) {
            currentColor = colors[i];  // Cambia el color de trazo
          }
        }

        // Dibuja con la mano derecha
        painting.noStroke();
        painting.fill(255, 0, 255);
        let d = dist(index.x, index.y, thumb.x, thumb.y);  // Calcula la distancia entre el índice y el pulgar
        if (d < 20) {
          painting.stroke(currentColor);  // Usa el color seleccionado para el trazo
          painting.strokeWeight(sw * 0.5);  // Ajusta el grosor del trazo
          painting.line(px, py, x, y);  // Dibuja una línea entre las posiciones anteriores y actuales
        }
        px = x;
        py = y;
      }
    }

    image(painting, 0, 0);  // Dibuja el contenido del lienzo en la pantalla
  }
}
