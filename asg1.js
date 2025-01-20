// Vertex shader program
var VS = `
    attribute vec4 a_Position;
    uniform float u_Size;
    void main(){
        gl_Position = a_Position;
        gl_PointSize =  u_Size;
    }`;


// Fragment shader program
var FS = `
    precision mediump float;
    uniform vec4 u_FragColor;
    void main(){
        gl_FragColor = u_FragColor;
    }`;

// Global vars
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
  
function setUpWegGL(){
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');
  
    // Get the rendering context for WebGL
    //gl = getWebGLContext(canvas);
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});

    if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
    }
}

function connectVariablesToGLSL(){
    if(!initShaders(gl, VS, FS)){
        console.log("Failed to load/compile shaders");
        return;
        }
    
    a_Position = gl.getAttribLocation(gl.program, "a_Position");
    if(a_Position < 0){
        console.log("Failed to get the storage location of a_Position");
        return;
    }

    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if(!u_FragColor){
        console.log("Failed to get the storage location of u_FragColor");
        return;
    }

    u_Size = gl.getUniformLocation(gl.program, 'u_Size');
    if(!u_Size){
        console.log("Failed to get the storage location of u_Size");
        return;
    }
}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;
const ERASER = 3;

let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize=5;
let g_selectedType=POINT;
let g_selectedSegments=50;

function addActionsForHtmlUI(){
    document.getElementById('red').onclick = function() {g_selectedColor = [1.0, 0.0,0.0, 1.0]; };
    document.getElementById('green').onclick = function() {g_selectedColor = [0.0, 1.0,0.0, 1.0]; };
    document.getElementById('blue').onclick = function() {g_selectedColor = [0.0, 0.0,1.0, 1.0]; };
    
    document.getElementById('clearButton').onclick = function() {g_shapesList = []; renderAllShapes(); };

    document.getElementById('pointButton').onclick = function() {g_selectedType=POINT};
    document.getElementById('triButton').onclick = function() {g_selectedType=TRIANGLE};
    document.getElementById('circleButton').onclick = function() {g_selectedType=CIRCLE};  
    document.getElementById('eraserButton').onclick = function() {g_selectedType = ERASER;};
      

    document.getElementById('redSlide').addEventListener('mouseup', function() {g_selectedColor[0] = this.value/100; });
    document.getElementById('greenSlide').addEventListener('mouseup', function() {g_selectedColor[1] = this.value/100; });
    document.getElementById('blueSlide').addEventListener('mouseup', function() {g_selectedColor[2] = this.value/100; });

    document.getElementById('sizeSlide').addEventListener('mouseup', function() {g_selectedSize = this.value; });

    document.getElementById('segmentSlide').addEventListener('mouseup', function() {g_selectedSegments = this.value; });

    document.getElementById("recreateButton").onclick = function () {
        recreateDrawing();
      };
      

}

function recreateDrawing() {
    const numTriangles = 25; // Number of triangles to draw
  
    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT);

    const cx = 0.0; // Center of the canvas
    const cy = 0.0;
    const radius = 0.7; // Radius of the starburst

    for (let i = 0; i < numTriangles; i++) {
        const angle1 = (2 * Math.PI * i) / numTriangles;
        const angle2 = (2 * Math.PI * (i + 1)) / numTriangles;

        // Outer points of the triangle (on the circumference)
        const x1 = cx + radius * Math.cos(angle1);
        const y1 = cy + radius * Math.sin(angle1);
        const x2 = cx + radius * Math.cos(angle2);
        const y2 = cy + radius * Math.sin(angle2);

        // Inner point (near the center)
        const x3 = cx;
        const y3 = cy;

        // Define the triangle
        let triangle = new Float32Array([
            x1, y1, 0.0, // Outer point 1
            x2, y2, 0.0, // Outer point 2
            x3, y3, 0.0, // Center point
        ]);

        // Generate random shades of purple
        const red = 0.5 + Math.random() * 0.5;  // Random red between 0.5 and 1.0
        const blue = 0.5 + Math.random() * 0.5; // Random blue between 0.5 and 1.0
        const green = Math.random() * 0.2;      // Random green between 0 and 0.2 for purple hue
        const alpha = 1.0;                      // Fully opaque

        // Set the color
        gl.uniform4f(u_FragColor, red, green, blue, alpha);

        // Draw the triangle
        drawTriangle(triangle);
    }
}




  

function main() {
    setUpWegGL();

    connectVariablesToGLSL();

    addActionsForHtmlUI();

    canvas.onmousedown = click;
    canvas.onmousemove = function(ev) {if(ev.buttons == 1) {click(ev)}};
  
    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    
  }



var g_shapesList = [];

function click(ev){
    let [x,y] = convertCoordinatedEventToGL(ev);

    canvas.style.cursor = g_selectedType === ERASER ? 'crosshair' : 'default';


    if (g_selectedType === ERASER) {
        // Eraser Mode: Remove shapes near the click position
        const threshold = 0.05; // Tolerance for removing shapes
        g_shapesList = g_shapesList.filter(shape => {
            const dx = shape.position[0] - x;
            const dy = shape.position[1] - y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            return distance > threshold; // Keep shapes outside the eraser's range
        });

        renderAllShapes();
        return;
    }

    let shape; 
    if(g_selectedType==POINT){
        shape = new Point();
    } else if (g_selectedType==TRIANGLE) {
        shape = new Triangle();
    } else {
        shape = new Circle();
        shape.segments = g_selectedSegments;
        
    }
    shape.position=[x,y];
    shape.color=g_selectedColor.slice();
    shape.size=g_selectedSize;
    g_shapesList.push(shape);

    renderAllShapes();
    
}

function convertCoordinatedEventToGL(ev){
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

    return([x,y]);
}

function renderAllShapes(){

    var startTime = performance.now();

    gl.clear(gl.COLOR_BUFFER_BIT);

    var len = g_shapesList.length;
    for(var i = 0; i < len; i++){
        g_shapesList[i].render();
    }

    var duration = performance.now() - startTime;
    sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps:  " + Math.floor(10000/duration)/10, "numdot");
}

function sendTextToHTML(text, htmlID){
    var htmlElm = document.getElementById(htmlID);
    if(!htmlElm){
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}

